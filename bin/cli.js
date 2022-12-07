/* eslint no-console: 0 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const _ = require('lodash');
const chalk = require('chalk');
const isGitClean = require('is-git-clean');
const updateCheck = require('update-check');
const findUp = require('find-up');
const semver = require('semver');
const { run: jscodeshift } = require('jscodeshift/src/Runner');

const pkg = require('../package.json');
const pkgUpgradeList = require('./upgrade-list');
const { getDependencies } = require('../transforms/utils/marker');
const transformLess = require('../less-transforms');

// jscodeshift codemod scripts dir
const transformersDir = path.join(__dirname, '../transforms');

// jscodeshift bin#--ignore-config
const ignoreConfig = path.join(__dirname, './codemod.ignore');

const transformers = [
  'v5-props-changed-migration',
  'v5-removed-component-migration',
  'v5-remove-style-import',
];

const dependencyProperties = [
  'dependencies',
  'devDependencies',
  'clientDependencies',
  'isomorphicDependencies',
  'buildDependencies',
];

async function ensureGitClean() {
  let clean = false;
  try {
    clean = await isGitClean();
  } catch (err) {
    if (
      err &&
      err.stderr &&
      err.stderr.toLowerCase().includes('not a git repository')
    ) {
      clean = true;
    }
  }

  if (!clean) {
    console.log(chalk.yellow('Sorry that there are still some git changes'));
    console.log('\n you must commit or stash them firstly');
    process.exit(1);
  }
}

async function checkUpdates() {
  let update;
  try {
    update = await updateCheck(pkg);
  } catch (err) {
    console.log(chalk.yellow(`Failed to check for updates: ${err}`));
  }

  if (update) {
    console.log(
      chalk.blue(`Latest version is ${update.latest}. Please update firstly`),
    );
    process.exit(1);
  }
}

function getMaxWorkers(options = {}) {
  // limit usage for cpus
  return options.cpus || Math.max(2, Math.ceil(os.cpus().length / 3));
}

function getRunnerArgs(
  transformerPath,
  parser = 'babylon', // use babylon as default parser
  options = {},
) {
  const args = {
    verbose: 2,
    // limit usage for cpus
    cpus: getMaxWorkers(options),
    // https://github.com/facebook/jscodeshift/blob/master/src/Runner.js#L255
    // https://github.com/facebook/jscodeshift/blob/master/src/Worker.js#L50
    babel: false,
    parser,
    // override default babylon parser config to enable `decorator-legacy`
    // https://github.com/facebook/jscodeshift/blob/master/parser/babylon.js
    parserConfig: require('./babylon.config.json'),
    extensions: ['tsx', 'ts', 'jsx', 'js'].join(','),
    transform: transformerPath,
    ignorePattern: '**/node_modules',
    ignoreConfig,
    args: ['antd', '@alipay/bigfish/antd'],
  };

  return args;
}

async function run(filePath, args = {}) {
  for (const transformer of transformers) {
    await transform(transformer, 'babylon', filePath, args);
  }

  await lessTransform(filePath, args);
}

async function lessTransform(filePath, options) {
  const maxWorkers = getMaxWorkers(options);
  const dir = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  // less part
  // `@antd/xxxx` | `~@antd/xxxx`
  return await transformLess(dir, { maxWorkers });
}

async function transform(transformer, parser, filePath, options) {
  console.log(chalk.bgGreen.bold('Transform'), transformer);
  const transformerPath = path.join(transformersDir, `${transformer}.js`);

  // pass closet .gitignore to jscodeshift as extra `--ignore-file` option
  // const gitignorePath = await findGitIgnore(filePath);

  const args = getRunnerArgs(transformerPath, parser, {
    ...options,
    // gitignore: gitignorePath,
  });

  try {
    if (process.env.NODE_ENV === 'local') {
      console.log(`Running jscodeshift with: ${JSON.stringify(args)}`);
    }

    // js part
    await jscodeshift(transformerPath, [ filePath ], args);
  } catch (err) {
    console.error(err);
    if (process.env.NODE_ENV === 'local') {
      const errorLogFile = path.join(__dirname, './error.log');
      fs.appendFileSync(errorLogFile, err);
      fs.appendFileSync(errorLogFile, '\n');
    }
  }
}

async function upgradeDetect(targetDir, needProLayout, needCompatible) {
  const result = [];
  const cwd = path.join(process.cwd(), targetDir);
  const { readPackageUp } = await import('read-pkg-up');
  const closetPkgJson = await readPackageUp({ cwd });

  let pkgJsonPath;
  if (!closetPkgJson) {
    pkgJsonPath = "we didn't find your package.json";
    // unknown dependency property
    result.push(['install', 'antd', pkgUpgradeList.antd]);
    if (needProLayout) {
      result.push([
        'install',
        '@ant-design/pro-layout',
        pkgUpgradeList['@ant-design/pro-layout'].version,
      ]);
    }

    if (needCompatible) {
      result.push([
        'install',
        '@ant-design/compatible',
        pkgUpgradeList['@ant-design/compatible'].version,
      ]);
    }
  } else {
    const { packageJson } = closetPkgJson;
    pkgJsonPath = closetPkgJson.path;

    // dependencies must be installed or upgraded with correct version
    const mustInstallOrUpgradeDeps = ['antd'];
    if (needProLayout) {
      mustInstallOrUpgradeDeps.push('@ant-design/pro-layout');
    }
    if (needCompatible) {
      mustInstallOrUpgradeDeps.push('@ant-design/compatible');
    }

    // handle mustInstallOrUpgradeDeps
    mustInstallOrUpgradeDeps.forEach(depName => {
      let hasDependency = false;
      const expectVersion = pkgUpgradeList[depName].version;
      // const upgradePkgDescription = pkgUpgradeList[depName].description;
      dependencyProperties.forEach(property => {
        const versionRange = _.get(packageJson, `${property}.${depName}`);
        // mark dependency installment state
        hasDependency = hasDependency || !!versionRange;
        // no dependency or improper version dependency
        if (versionRange && !semver.satisfies(semver.minVersion(versionRange), expectVersion)) {
          result.push(['update', depName, expectVersion, property]);
        }
      });
      if (!hasDependency) {
        // unknown dependency property
        result.push(['install', depName, pkgUpgradeList[depName].version]);
      }
    });

    // dependencies must be upgraded to correct version
    const mustUpgradeDeps = _.without(
      Object.keys(pkgUpgradeList),
      ...mustInstallOrUpgradeDeps,
    );
    mustUpgradeDeps.forEach(depName => {
      dependencyProperties.forEach(property => {
        const expectVersion = pkgUpgradeList[depName].version;
        const versionRange = _.get(packageJson, `${property}.${depName}`);
        /**
         * we may have dependencies in `package.json`
         * make sure that they can `work well` with `antd5`
         * so we check dependency's version here
         */
        if (versionRange && !semver.satisfies(semver.minVersion(versionRange), expectVersion)) {
          result.push(['update', depName, expectVersion, property]);
        }
      });
    });
  }

  if (!result.length) {
    console.log(chalk.green('Checking passed'));
    return;
  }

  console.log(
    chalk.yellow(
      "It's recommended to install or upgrade these dependencies to ensure working well with antd v5\n",
    ),
  );
  console.log(`> package.json file:  ${pkgJsonPath} \n`);
  const dependencies = result.map(
    ([operateType, depName, expectVersion, dependencyProperty]) =>
      [
        _.capitalize(operateType),
        `${depName}${expectVersion}`,
        dependencyProperty ? `in ${dependencyProperty}` : '',
      ].join(' '),
  );

  console.log(dependencies.map(n => `* ${n}`).join('\n'));
}

async function findGitIgnore(targetDir) {
  const cwd = path.join(process.cwd(), targetDir);
  return await findUp('.gitignore', { cwd });
}

/**
 * options
 * --force   // force skip git checking (dangerously)
 * --cpus=1  // specify cpus cores to use
 */

async function bootstrap() {
  const dir = process.argv[2];
  // eslint-disable-next-line global-require
  const args = require('yargs-parser')(process.argv.slice(3));
  if (process.env.NODE_ENV !== 'local') {
    // check for updates
    await checkUpdates();
    // check for git status
    if (!args.force) {
      await ensureGitClean();
    } else {
      console.log(
        Array(3)
          .fill(1)
          .map(() =>
            chalk.yellow(
              'WARNING: You are trying to skip git status checking, please be careful',
            ),
          )
          .join('\n'),
      );
    }
  }

  // check for `path`
  if (!dir || !fs.existsSync(dir)) {
    console.log(chalk.yellow('Invalid dir:', dir, ', please pass a valid dir'));
    process.exit(1);
  }

  await run(dir, args);

  try {
    console.log('----------- antd5 dependencies alert -----------\n');
    const depsList = await getDependencies();
    await upgradeDetect(
      dir,
      depsList.includes('@ant-design/pro-layout'),
      depsList.includes('@ant-design/compatible'),
    );
  } catch (err) {
    console.log('skip summary due to', err);
  } finally {
    console.log(
      `\n----------- Thanks for using @ant-design/codemod ${pkg.version} -----------`,
    );
  }
}

module.exports = {
  bootstrap,
  ensureGitClean,
  transform,
  run,
  getRunnerArgs,
  checkUpdates,
};
