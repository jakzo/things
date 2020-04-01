export = {
  configs: {
    recommended: {
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/typescript',
        'plugin:import/errors',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
      ],
      plugins: [
        // Downgrade linting errors to warnings when running in the VSCode extension so that they can
        // be distinguished from compiler errors by showing a yellow underline instead of red
        ...(process.env.VSCODE_PID ? ['only-warn'] : []),
      ],
      env: {
        es2017: true,
        node: true,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018,
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
      rules: {
        'no-empty': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/require-await': 'off',

        'no-constant-condition': ['error', { checkLoops: false }],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],

        '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
        'import/no-cycle': 'error',
        'import/order': [
          'error',
          {
            'newlines-between': 'always',
            groups: ['builtin', 'external', 'internal', ['index', 'sibling', 'parent']],
            alphabetize: { order: 'asc' },
          },
        ],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-useless-path-segments': 'error',
        'import/no-self-import': 'error',
      },
      overrides: [
        {
          files: ['**/__*__/**'],
          extends: ['plugin:jest/recommended'],
          rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/require-await': 'off',
          },
        },
      ],
    },
  },
};
