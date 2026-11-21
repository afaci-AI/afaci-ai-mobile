import { defineConfig, globalIgnores } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat.js'

// Границы слоёв (см. docs/architecture-god-files-solid.md и AGENTS.md):
//   app -> features -> shared. Роуты не обращаются к API напрямую,
//   shared не знает о модулях, модуль не лезет во внутренности другого.
function restrict(...patterns) {
  return ['error', { patterns }]
}

const deepFeature = {
  group: ['@/features/*/*'],
  message:
    'Импортируйте фичу целиком (@/features/<имя>): внутренности закрыты.',
}
const noApi = {
  group: ['@/shared/api', '@/shared/api/*'],
  message:
    'Роуты app/ не обращаются к API: используйте экран из @/features/<имя>.',
}
const sharedIsLow = {
  group: ['@/features/*', '@/app/*'],
  message: 'shared/ не зависит от модулей и app/.',
}
function crossModule(self) {
  return {
    group: ['@/features/*/**', '!@/features/' + self + '/**'],
    message:
      'Не импортируйте внутренности другого модуля: только его index.ts.',
  }
}

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
  {
    files: ['app/**'],
    rules: { 'no-restricted-imports': restrict(noApi, deepFeature) },
  },
  {
    files: ['src/shared/**'],
    rules: { 'no-restricted-imports': restrict(sharedIsLow) },
  },
  {
    files: ['src/features/admin/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('admin'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/calculator/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('calculator'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/catalog/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('catalog'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/home/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('home'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/norms/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('norms'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/products/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('products'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/features/saved/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('saved'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    // Размер и сложность. Сторонний код UI-кита и сгенерированные файлы
    // исключены. Файлы, уже нарушающие пороги, перечислены в baseline ниже;
    // список только сокращается (этап 11 плана).
    files: ['app/**', 'src/**'],
    ignores: ['src/shared/ui/**', 'src/shared/api/schema.d.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', 15],
    },
  },
  {
    files: [
      'src/features/admin/dictionaries-screen.tsx',
      'src/features/admin/dictionary-dialog.tsx',
      'src/features/admin/product-form-screen.tsx',
      'src/features/admin/products-screen.tsx',
      'src/features/admin/user-form-screen.tsx',
      'src/features/admin/users-screen.tsx',
      'src/features/calculator/components/optimize-cost-dialog.tsx',
      'src/features/calculator/components/reference-info-dialog.tsx',
      'src/features/calculator/components/save-recipe-dialog.tsx',
      'src/features/calculator/components/verdict-card.tsx',
      'src/features/catalog/database-screen.tsx',
      'src/features/products/product-detail-screen.tsx',
      'src/features/saved/recipe-detail-screen.tsx',
      'src/features/saved/saved-screen.tsx',
      'src/shared/api/client.ts',
      'src/shared/api/models.ts',
    ],
    rules: { complexity: 'off' },
  },
  {
    files: ['src/features/admin/nutrient-dialog.tsx'],
    rules: { complexity: 'off', 'max-lines-per-function': 'off' },
  },
  {
    files: [
      'src/features/admin/product-detail-screen.tsx',
      'src/features/calculator/calculator-screen.tsx',
    ],
    rules: {
      complexity: 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['src/features/saved/ranking-panel.tsx'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
  {
    // Корневой layout подключает провайдер запросов (композиция приложения).
    files: ['app/_layout.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
])
