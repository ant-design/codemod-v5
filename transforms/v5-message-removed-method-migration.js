const {
  parseStrToArray,
} = require('./utils');
const { printOptions } = require('./utils/config');
const { findAllAssignedNames } = require('./utils/ast');

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  const antdPkgNames = parseStrToArray(options.antdPkgNames || 'antd');

  function replaceWarn(msgApiName) {
    // msgApi.warn => msgApi.warning
    root.find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'Identifier',
          name: msgApiName,
        },
        property: {
          type: 'Identifier',
          name: 'warn'
        }
      },
    }).forEach(path => {
      path.node.callee.property.name = 'warning';
    });
  }

  function replaceMessageCall(path) {
    // const [messageApi, contextHolder] = messageAlias;
    if (path.node.id.type === 'ArrayPattern') {
      const msgApiName  = path.node.id.elements[0].name;
      // 处理反复 reassign 的场景
      const localAssignedNames = findAllAssignedNames(
        root, j,
        msgApiName,
        [msgApiName],
      );

      localAssignedNames.forEach(apiName => {
        replaceWarn(apiName);
        hasChanged = true;
      });
    } else if (path.node.id.type === 'Identifier') {
      // const msg = msg;
      // 处理反复 reassign 的场景
      const msgName = path.node.id.name;
      const localAssignedNames = findAllAssignedNames(
        root, j,
        msgName,
        [msgName],
      );

      localAssignedNames.forEach(apiName => {
        // const [api] = msg;
        root.find(j.VariableDeclarator, {
          init: {
            type: 'Identifier',
            name: apiName,
          },
        }).forEach(path => {
          replaceMessageCall(path);
          hasChanged = true;
        });

        // msgNamespace[0].warn => msgNamespace[0].warning
        root.find(j.CallExpression, {
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: apiName,
              },
              property: {
                type: 'NumericLiteral',
                value: 0,
              },
            },
          },
        }).forEach(path => {
          path.node.callee.property.name = 'warning';
        });
      });
    }
  }

  // rename old Message.warn() calls to Message.warning()
  function renameMessageWarnMethodCalls(j, root) {
    let hasChanged = false;
    root
      .find(j.Identifier)
      .filter(
        path =>
          path.node.name === 'message' &&
          path.parent.node.type === 'ImportSpecifier' &&
          antdPkgNames.includes(path.parent.parent.node.source.value),
      )
      .forEach(path => {
        const localComponentName = path.parent.node.local.name;
        // message.warn -> message.warning
        replaceWarn(localComponentName);
        hasChanged = true;
        
        // useMessage called()
        // const [messageApi, contextHolder] = message.useMessage();
        // const msg = message.useMessage();
        root.find(j.VariableDeclarator, {
          init: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              property: {
                type: 'Identifier',
                name: 'useMessage',
              },
            },
          },
        }).forEach(path => {
          replaceMessageCall(path);
        });
      });

    return hasChanged;
  }

  // step1. // rename old Model.method() calls
  // step2. cleanup antd import if empty
  let hasChanged = false;
  hasChanged = renameMessageWarnMethodCalls(j, root) || hasChanged;

  return hasChanged
    ? root.toSource(options.printOptions || printOptions)
    : null;
};
