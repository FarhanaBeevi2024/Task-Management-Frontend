import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      /** Catch undefined variables (same class of bug as missing canPickMilestone, etc.) */
      'no-undef': 'error',

      /** React Refresh: allow non-component exports in small modules */
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      /** Pragmatic defaults for existing codebase */
      'react/prop-types': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          /** Vite + @vitejs/plugin-react uses automatic JSX runtime — default `import React` is unused */
          varsIgnorePattern: '^(React|_)$',
          caughtErrors: 'none',
        },
      ],
    },
  },
];
