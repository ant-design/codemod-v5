const { printOptions } = require('./utils/config');
const {
  addSubmoduleImport,
  addStyleModuleImport,
  removeEmptyModuleImport,
  parseStrToArray,
} = require('./utils');
const { markDependency } = require('./utils/marker');

const removedComponentConfig = {
  Comment: {
    importSource: '@ant-design/compatible',
  },
  PageHeader: {
    importSource: '@ant-design/pro-layout',
  },
  BackTop: {
    importSource: 'antd',
    rename: 'FloatButton.BackTop',
  },
};

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  const antdPkgNames = parseStrToArray(options.antdPkgNames || 'antd');

  // import { Comment } from '@ant-design/compatible'
  // import { PageHeader } from '@ant-design/pro-components'
  function importDeprecatedComponent(j, root) {
    let hasChanged = false;

    // import { Comment, PageHeader } from 'antd';
    // import { Comment, PageHeader } from '@forked/antd';
    const componentNameList = Object.keys(removedComponentConfig);

    root
      .find(j.Identifier)
      .filter(
        path =>
          componentNameList.includes(path.node.name) &&
          path.parent.node.type === 'ImportSpecifier' &&
          antdPkgNames.includes(path.parent.parent.node.source.value),
      )
      .forEach(path => {
        hasChanged = true;
        const importedComponentName = path.parent.node.imported.name;
        const antdPkgName = path.parent.parent.node.source.value;

        // remove old imports
        const importDeclaration = path.parent.parent.node;
        importDeclaration.specifiers = importDeclaration.specifiers.filter(
          specifier =>
            !specifier.imported ||
            specifier.imported.name !== importedComponentName,
        );

        // add new import from '@ant-design/compatible'
        const localComponentName = path.parent.node.local.name;
        const importConfig = removedComponentConfig[importedComponentName];
        if (importConfig.rename) {
          if (importConfig.rename.includes('.')) {
            // `FloatButton.BackTop`
            const [
              newComponentName,
              compoundComponentName,
            ] = importConfig.rename.split('.');
            // import part
            const importedLocalName = addSubmoduleImport(j, root, {
              moduleName: importConfig.importSource,
              importedName: newComponentName,
              before: antdPkgName,
            });
            // rename part
            root
              .find(j.JSXElement, {
                openingElement: {
                  name: { name: localComponentName },
                },
              })
              .forEach(path => {
                path.node.openingElement.name = j.jsxMemberExpression(
                  j.jsxIdentifier(importedLocalName),
                  j.jsxIdentifier(compoundComponentName),
                );
              });
          }
        } else {
          addSubmoduleImport(j, root, {
            moduleName: importConfig.importSource,
            importedName: importedComponentName,
            localName: localComponentName,
            before: antdPkgName,
          });
        }
        markDependency(importConfig);
      });

    return hasChanged;
  }

  // step1. import deprecated components from '@ant-design/compatible'
  // step2. cleanup antd import if empty
  let hasChanged = false;
  hasChanged = importDeprecatedComponent(j, root) || hasChanged;

  if (hasChanged) {
    antdPkgNames.forEach(antdPkgName => {
      removeEmptyModuleImport(j, root, antdPkgName);
    });
  }

  return hasChanged
    ? root.toSource(options.printOptions || printOptions)
    : null;
};
