module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  automock: false,
  clearMocks: true,
  preset: "ts-jest",
  testPathIgnorePatterns: ["/node_modules/", "/out/", "/integration/"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  }
};