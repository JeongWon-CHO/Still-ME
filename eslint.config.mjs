import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import expo from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  globalIgnores(['ios/', 'android/', '.expo/', 'dist/', 'expo-env.d.ts']),
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'plugins/**/*.js'],
    extends: [expo],
  },
  prettier,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'always' },
      ],
    },
  },
]);
