import { defineTest } from 'jscodeshift/src/testUtils';

const testUnit = 'v5-message-removed-method-migration';
const tests = ['basic'];

describe(testUnit, () => {
  tests.forEach(test =>
    defineTest(
      __dirname,
      testUnit,
      { antdPkgNames: ['antd', '@forked/antd'].join(',') },
      `${testUnit}/${test}`,
      { parser: 'babylon' },
    ),
  );
});
