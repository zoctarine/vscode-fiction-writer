module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  automock: false,
  clearMocks: true,
  preset: "ts-jest",
  verbose: false,
  testPathIgnorePatterns: ["/node_modules/", "/out/", "/integration/"],
  globals: {
    preset: 'ts-jest'
  }
};