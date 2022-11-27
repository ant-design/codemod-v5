import { defineTest } from 'jscodeshift/src/testUtils';

const testUnit = 'v5-removed-component-migration';
const tests = ['basic', 'alias-import', 'imported'];

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
