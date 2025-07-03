module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react-refresh',
    '@typescript-eslint',
    'react',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React Refresh
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // TypeScript rules - relaxed for development
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for WebMIDI API
    
    // React rules - focused on actual issues
    'react/prop-types': 'off', // Using TypeScript
    'react/display-name': 'off', // Not critical for development
    'react/jsx-key': 'error', // Important for performance
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-array-index-key': 'off', // Sometimes necessary
    'react/no-danger': 'warn',
    'react/no-deprecated': 'error',
    'react/no-unescaped-entities': 'off', // Too strict
    'react/self-closing-comp': 'off', // Stylistic
    
    // General rules - development-friendly
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': 'off', // Essential for MIDI debugging
    'no-debugger': 'warn',
    'no-alert': 'off', // Sometimes needed for user feedback
    'eqeqeq': ['warn', 'always'],
    
    // Performance related
    'react-hooks/exhaustive-deps': 'warn',
    'no-nested-ternary': 'off', // Sometimes necessary for complex UI
  },
  overrides: [
    {
      // More lenient rules for development/test files
      files: ['*.test.ts', '*.test.tsx', 'vite.config.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      },
    },
    {
      // Type definition files
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      // Specific rules for MIDI-related files
      files: ['src/lib/midi/**/*.ts', 'src/hooks/useMIDI.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}