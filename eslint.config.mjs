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
  {
    // Размер текста — только константы из src/shared/theme/font-sizes.ts.
    files: ['app/**/*.tsx', 'src/**/*.tsx'],
    ignores: ['src/shared/ui/!(kit|charts)/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXOpeningElement[name.name=/^(Text|Heading)$/] > JSXAttribute[name.name='size'] > Literal",
          message: 'Используйте FontSize из @/shared/theme/font-sizes.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='Select'] > JSXAttribute[name.name='selectedTextSize'] > Literal",
          message: 'Используйте FontSize из @/shared/theme/font-sizes.',
        },
      ],
    },
  },
])
