import { defineTest } from 'jscodeshift/src/testUtils';

const testUnit = 'v5-removed-static-method-migration';
const tests = ['message', 'notification'];

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
