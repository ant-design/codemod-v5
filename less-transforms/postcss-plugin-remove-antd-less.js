const testAntdImportRegex = /(?:\(.+\)\s+)?(?:"|').*(~?antd\/.+\.less|~?@ant-design\/compatible\/assets\/index\.css)(?:"|');?$/;

module.exports = (opts = {}) => {
  return {
    postcssPlugin: 'postcss-plugin-remove-antd-less',
    AtRule: {
      import(atRule, { postcss }) {
        // TODO: handle forked antd
        const params = atRule.params.replace(atRule.options || '', '');
        if (testAntdImportRegex.test(params)) {
          const commentedRule = postcss.comment({
            text: `${atRule.toString()};`,
          });
          atRule.replaceWith(commentedRule);
        }
      },
    },
  };
};

module.exports.postcss = true;
