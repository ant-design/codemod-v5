module.exports = {
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],
  transform: { '\\.ts$': ['ts-jest'] },
};
