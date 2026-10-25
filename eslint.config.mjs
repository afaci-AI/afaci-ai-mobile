import { defineConfig, globalIgnores } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat.js'

export default defineConfig([
  expoConfig,
  globalIgnores([
    'node_modules/**',
    '.expo/**',
    'android/**',
    'ios/**',
    'dist/**',
  ]),
])
