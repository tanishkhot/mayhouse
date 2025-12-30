module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  roots: ["<rootDir>/src", "<rootDir>/../tests/frontend"],
  moduleDirectories: ["node_modules", "<rootDir>/node_modules"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)",
    "<rootDir>/src/**/?(*.)+(spec|test).(ts|tsx|js|jsx)",
    "<rootDir>/../tests/frontend/**/*.test.(ts|tsx|js|jsx)",
    "<rootDir>/../tests/frontend/**/*.spec.(ts|tsx|js|jsx)",
  ],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
};
