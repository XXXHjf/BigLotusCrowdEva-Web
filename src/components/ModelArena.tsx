// src/components/ModelArena.tsx
import { useMemo, useState } from 'react'
import { Row, Col, Typography, Card, Divider, Select, Space } from 'antd'
import ModelScoreRadar from './ModelScoreRadar'

interface StrategyDef {
  key: string
  label: string
}

interface MetricPair {
  mae: number
  rmse: number
}

interface ModelMetricRow {
  name: string
  metrics: Record<string, MetricPair>
}

interface ModelArenaData {
  strategies: StrategyDef[]
  models: ModelMetricRow[]
}

interface ModelArenaProps {
  data: ModelArenaData
}

const { Title, Text, Paragraph } = Typography

const toScore = (values: number[]): number[] => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1e-6)
  return values.map((v) => Number((55 + ((max - v) / span) * 45).toFixed(1)))
}

const ModelArena = ({ data }: ModelArenaProps) => {
  const modelOptions = data.models.map((model) => ({ value: model.name, label: model.name }))
  const defaultModelName =
    modelOptions.find((item) => item.value === 'Average')?.value || modelOptions[0]?.value || ''
  const [selectedModelName, setSelectedModelName] = useState<string>(defaultModelName)
  const hasData = data.models.length > 0 && data.strategies.length > 0

  const selectedModel = useMemo(() => {
    if (!hasData) {
      return null
    }

    return data.models.find((model) => model.name === selectedModelName) || data.models[0]
  }, [data.models, hasData, selectedModelName])

  if (!hasData || !selectedModel) {
    return (
      <Card className="panel-card" bordered={false}>
        <Title level={4}>模型准确率</Title>
        <Paragraph>暂无主实验结果数据。</Paragraph>
      </Card>
    )
  }

  const strategyLabels = data.strategies.map((s) => s.label)
  const maeRaw = data.strategies.map((s) => selectedModel.metrics[s.key]?.mae ?? 0)
  const rmseRaw = data.strategies.map((s) => selectedModel.metrics[s.key]?.rmse ?? 0)

  const maeScores = toScore(maeRaw)
  const rmseScores = toScore(rmseRaw)

  const combinedScores = data.strategies.map((s, idx) => ({
    key: s.key,
    label: s.label,
    score: Number(((maeScores[idx] + rmseScores[idx]) / 2).toFixed(2)),
    mae: maeRaw[idx],
    rmse: rmseRaw[idx],
  }))

  const recommended = combinedScores.reduce((best, cur) => (cur.score > best.score ? cur : best), combinedScores[0])
  const baseline = combinedScores.find((item) => item.key === 'baseline')
  const maeImprove = baseline
    ? Number((((baseline.mae - recommended.mae) / baseline.mae) * 100).toFixed(2))
    : 0
  const rmseImprove = baseline
    ? Number((((baseline.rmse - recommended.rmse) / baseline.rmse) * 100).toFixed(2))
    : 0

  return (
    <Card className="panel-card" bordered={false}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          模型准确率雷达
        </Title>
        <Space>
          <Text type="secondary">展示模型</Text>
          <Select
            style={{ minWidth: 170 }}
            value={selectedModel.name}
            options={modelOptions}
            onChange={setSelectedModelName}
          />
        </Space>
      </Space>

      <Row gutter={[24, 16]} align="middle" style={{ marginTop: 12 }}>
        <Col span={16}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Title level={5} style={{ textAlign: 'center' }}>
                MAE策略对比得分
              </Title>
              <ModelScoreRadar
                indicators={strategyLabels}
                series={[
                  {
                    name: 'MAE得分',
                    values: maeScores,
                    color: '#4cc3ff',
                    areaColor: 'rgba(76, 195, 255, 0.22)',
                  },
                ]}
              />
            </Col>
            <Col span={12}>
              <Title level={5} style={{ textAlign: 'center' }}>
                RMSE策略对比得分
              </Title>
              <ModelScoreRadar
                indicators={strategyLabels}
                series={[
                  {
                    name: 'RMSE得分',
                    values: rmseScores,
                    color: '#5ad8a6',
                    areaColor: 'rgba(90, 216, 166, 0.2)',
                  },
                ]}
              />
            </Col>
          </Row>
        </Col>

        <Col span={8}>
          <Divider type="vertical" style={{ height: '100%' }} />
          <div style={{ paddingLeft: '24px' }}>
            <Title level={5}>系统推荐</Title>
            <Paragraph>
              在 <Text strong>{selectedModel.name}</Text> 模型下，综合 MAE/RMSE 得分后推荐使用{' '}
              <Text strong style={{ color: '#4cc3ff' }}>
                {recommended.label}
              </Text>
              。
            </Paragraph>
            <Paragraph>
              相比 Baseline：MAE 改善 <Text strong>{maeImprove}%</Text>，RMSE 改善{' '}
              <Text strong>{rmseImprove}%</Text>。
            </Paragraph>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

export default ModelArena
