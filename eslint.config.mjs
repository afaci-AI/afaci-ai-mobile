import { defineConfig, globalIgnores } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat.js'

// Границы слоёв (см. docs/architecture-god-files-solid.md и AGENTS.md):
//   app -> modules -> shared. Роуты не обращаются к API напрямую,
//   shared не знает о модулях, модуль не лезет во внутренности другого.
function restrict(...patterns) {
  return ['error', { patterns }]
}

const noApi = {
  group: ['@/shared/api', '@/shared/api/*', '@/modules/*/api'],
  message: 'Роуты app/ не обращаются к API: используйте экран или hook модуля.',
}
const sharedIsLow = {
  group: ['@/modules/*', '@/app/*'],
  message: 'shared/ не зависит от модулей и app/.',
}
function crossModule(self) {
  return {
    group: ['@/modules/*/**', '!@/modules/' + self + '/**'],
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
  { files: ['app/**'], rules: { 'no-restricted-imports': restrict(noApi) } },
  {
    files: ['src/shared/**'],
    rules: { 'no-restricted-imports': restrict(sharedIsLow) },
  },
  {
    files: ['src/modules/admin/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('admin'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/calculator/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('calculator'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/catalog/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('catalog'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/home/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('home'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/norms/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('norms'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/products/**'],
    rules: {
      'no-restricted-imports': restrict(crossModule('products'), {
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
  {
    files: ['src/modules/saved/**'],
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
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', 15],
    },
  },
  {
    files: [
      'app/(tabs)/database/index.tsx',
      'src/modules/admin/product-form-screen.tsx',
      'src/modules/calculator/components/optimize-cost-dialog.tsx',
      'src/modules/calculator/components/reference-info-dialog.tsx',
      'src/modules/calculator/components/save-recipe-dialog.tsx',
      'src/modules/calculator/components/verdict-card.tsx',
      'src/modules/products/product-detail-screen.tsx',
      'src/modules/saved/recipe-detail-screen.tsx',
      'src/shared/api/client.ts',
      'src/shared/api/models.ts',
    ],
    rules: { complexity: 'off' },
  },
  {
    files: [
      'src/modules/admin/dictionaries-screen.tsx',
      'src/modules/admin/product-detail-screen.tsx',
      'src/modules/calculator/calculator-screen.tsx',
    ],
    rules: {
      complexity: 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: [
      'src/modules/admin/nutrient-dialog.tsx',
      'src/modules/admin/products-screen.tsx',
      'src/modules/admin/user-form-screen.tsx',
      'src/modules/admin/users-screen.tsx',
      'src/modules/saved/saved-screen.tsx',
    ],
    rules: { complexity: 'off', 'max-lines-per-function': 'off' },
  },
  {
    files: ['src/modules/saved/ranking-panel.tsx'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
  {
    // Baseline границ: роуты, которые пока обращаются к API напрямую.
    files: [
      'app/(tabs)/database/filters.tsx',
      'app/(tabs)/database/index.tsx',
      'app/(tabs)/profile/index.tsx',
      'app/_layout.tsx',
      'app/admin/products/filters.tsx',
    ],
    rules: { 'no-restricted-imports': restrict() },
  },
  {
    // Baseline границ: импорты внутренностей других модулей (станут
    // импортами через index.ts на этапе 11 плана).
    files: [
      'src/modules/admin/admin-product-grid-card.tsx',
      'src/modules/admin/api.ts',
      'src/modules/admin/dashboard-screen.tsx',
      'src/modules/admin/nutrient-dialog.tsx',
      'src/modules/admin/nutrient-toolbar.tsx',
      'src/modules/admin/product-detail-screen.tsx',
      'src/modules/admin/product-form-screen.tsx',
      'src/modules/admin/products-screen.tsx',
      'src/modules/calculator/api.ts',
      'src/modules/calculator/components/product-search-modal.tsx',
      'src/modules/calculator/types.ts',
      'src/modules/products/nutrients.ts',
      'src/modules/products/product-detail-screen.tsx',
      'src/modules/saved/api.ts',
      'src/modules/saved/ranking-panel.tsx',
      'src/modules/saved/ranking-screen.tsx',
      'src/modules/saved/recipe-edit-screen.tsx',
      'src/modules/saved/recipe-metrics.tsx',
      'src/modules/saved/recipe-quality-chart.tsx',
      'src/modules/saved/saved-screen.tsx',
    ],
    rules: {
      'no-restricted-imports': restrict({
        group: ['@/app/*'],
        message: 'Модули не импортируют app/.',
      }),
    },
  },
])
