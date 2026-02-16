module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    moduleNameMapper: {
        '^primeng/(.*)/(.*)$': '<rootDir>/node_modules/primeng/fesm2022/primeng-$1-$2.mjs',
        '^primeng/(.*)$': '<rootDir>/node_modules/primeng/fesm2022/primeng-$1.mjs',
        '^@primeuix/utils/(.*)$': '<rootDir>/node_modules/@primeuix/utils/dist/$1/index.mjs',
        '^@primeuix/(.*)$': '<rootDir>/node_modules/@primeuix/$1',
    },
    transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|primeng|@primeuix|@angular|rxjs))'],
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$',
            },
        ],
    },
};
