const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const markerPath = path.join(
  process.env.NODE_ENV === 'local' ? process.cwd() : require('os').tmpdir(),
  './antd5-codemod-marker.log',
);

const newline = '\n';

function ensureFile() {
  return fs.openSync(markerPath, 'w');
}

async function cleanup() {
  return await fs.promises.unlink(markerPath);
}

function markDependency(depName) {
  ensureFile();
  return fs.appendFileSync(
    markerPath,
    depName + newline,
    'utf8'
  );
}

async function getDependencies() {
  const content = await fs.promises.readFile(markerPath, 'utf8');
  await cleanup();
  return _.uniq((content || '').split(newline));
}

module.exports = {
  markDependency,
  getDependencies,
};
