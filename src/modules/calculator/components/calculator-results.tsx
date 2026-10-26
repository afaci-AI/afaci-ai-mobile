import { memo } from 'react'

import { formatNumber as nf } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { MacroChart } from '@/shared/ui/charts/macro-chart'
import { Heading } from '@/shared/ui/heading'
import { Badge, Card } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

import { aminoAcidName } from '../amino-acid-names'
import type { ComputeResult } from '../types'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box className="gap-1 border-b border-border py-2">
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      <Text bold className="text-foreground">
        {value}
      </Text>
    </Box>
  )
}

export const CalculatorResults = memo(function CalculatorResults({
  result,
}: {
  result: ComputeResult
}) {
  const q = result.quality
  const m = result.macro
  return (
    <VStack space="lg">
      <Heading size="xl" className="text-foreground">
        Результат расчёта
      </Heading>
      {result.warnings?.length ? (
        <Card className="border-destructive">
          <Heading size="sm" className="text-foreground">
            Предупреждения
          </Heading>
          {result.warnings.map((warning, index) => (
            <Text key={index} className="text-destructive-text">
              {warning}
            </Text>
          ))}
        </Card>
      ) : null}
      {result.verdict ? (
        <Card>
          <Heading size="md" className="text-foreground">
            {result.verdict.headline}
          </Heading>
          <Badge
            label={
              result.verdict.level === 'good'
                ? 'Высокое качество'
                : result.verdict.level === 'poor'
                  ? 'Низкое качество'
                  : 'Удовлетворительно'
            }
          />
          {result.verdict.points.map((point, index) => (
            <Text key={index} className="text-foreground">
              {point}
            </Text>
          ))}
        </Card>
      ) : null}
      <Card>
        <Metric
          label="Энергоценность"
          value={`${nf(result.energy_kcal, 0)} ккал/100 г`}
        />
        <Metric
          label="Аминокислота с наименьшим скором"
          value={
            result.c_min
              ? `${aminoAcidName(result.c_min.name)} · ${nf(result.c_min.score, 1)}%`
              : '—'
          }
        />
        <Text size="sm" className="text-muted-foreground">
          Аминокислот со скором ниже эталона: {result.limiting_count}.{' '}
          {result.limiting.map(aminoAcidName).join(', ')}
        </Text>
      </Card>
      <Card>
        <Heading size="md" className="text-foreground">
          Рецептура на 100 г
        </Heading>
        {result.recipe.map((item, index) => (
          <Box key={index} className="gap-1 border-b border-border py-2">
            <Text bold className="text-foreground">
              {item.name} · {nf(item.amount_g)} г
            </Text>
            <Text size="sm" className="text-muted-foreground">
              {item.region ?? 'Регион не указан'} ·{' '}
              {item.subcategory ?? 'Без подкатегории'}
            </Text>
          </Box>
        ))}
        <Text bold className="text-foreground">
          Σ = {nf(result.sum_g)} г
        </Text>
      </Card>
      <MacroChart
        title="Макросостав"
        subtitle="Граммы на 100 г продукта"
        donut={false}
        values={[
          { key: 'protein', label: 'Белки', value: m.protein, unit: 'г' },
          { key: 'fat', label: 'Жиры', value: m.fat, unit: 'г' },
          { key: 'carb', label: 'Углеводы', value: m.carb, unit: 'г' },
          {
            key: 'fiber',
            label: 'Пищевые волокна',
            value: m.fiber,
            unit: 'г',
          },
        ]}
        footer={
          <Metric
            label="Белок : жир"
            value={`1 : ${nf(m.protein_fat_ratio)}`}
          />
        }
      />
      <Card>
        <Heading size="md" className="text-foreground">
          Аминокислотный скор
        </Heading>
        <Text className="text-muted-foreground">
          Эталон: {result.reference.name}. Скор эталона — 100%. Скор ниже 100%
          означает, что аминокислоты меньше, чем в эталонном белке.
        </Text>
        {[...result.amino_acids]
          .sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity))
          .map((amino) => (
            <Box key={amino.name} className="gap-2 border-b border-border py-3">
              <Text bold className="text-foreground">
                {aminoAcidName(amino.name)}
              </Text>
              <Text className="text-foreground">
                Содержание: {nf(amino.m_j)} г/100 г белка
              </Text>
              <Text className="text-foreground">
                Аминокислотный скор: {nf(amino.score, 1)}%
              </Text>
              <Badge
                label={
                  amino.is_min
                    ? 'Наименьший скор'
                    : amino.is_limiting
                      ? 'Ниже эталона'
                      : amino.score == null
                        ? 'Нет данных'
                        : amino.score > 100
                          ? 'Выше эталона'
                          : 'Соответствует эталону'
                }
                variant={
                  amino.is_limiting || amino.is_min
                    ? 'warning'
                    : amino.score != null &&
                        Number.isFinite(amino.score) &&
                        amino.score >= 100
                      ? 'info'
                      : 'secondary'
                }
              />
              <Text size="sm" className="text-muted-foreground">
                Эталон: {nf(amino.reference)} г/100 г белка
              </Text>
              <Text size="sm" className="text-muted-foreground">
                Коэффициент сбалансированности: {nf(amino.utility)}
              </Text>
            </Box>
          ))}
      </Card>
      <Card>
        <Heading size="md" className="text-foreground">
          Качественные показатели
        </Heading>
        <Metric
          label="КРАС — различия аминокислотного скора"
          value={`${nf(q.kras, 1)}%`}
        />
        <Metric label="БЦ — биологическая ценность" value={`${nf(q.bc, 1)}%`} />
        <Metric label="V — коэффициент утилитарности" value={nf(q.V)} />
        <Metric
          label="G — сопоставимая избыточность"
          value={`${nf(q.G)} г/100 г белка`}
        />
      </Card>
    </VStack>
  )
})
