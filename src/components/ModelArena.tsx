// src/components/ModelArena.tsx
import { Row, Col, Typography, Card, Divider } from 'antd'
import ModelScoreRadar from './ModelScoreRadar'

interface ModelArenaProps {
  data: {
    lstmScores: {
      name: string
      scores: number[]
    }
    transformerScores: {
      name: string
      scores: number[]
    }
  }
}

const { Title, Text, Paragraph } = Typography

const ModelArena = ({ data }: ModelArenaProps) => {
  const lstmTotal = data.lstmScores.scores.reduce((a, b) => a + b, 0)
  const transformerTotal = data.transformerScores.scores.reduce((a, b) => a + b, 0)

  const recommendedModel =
    lstmTotal > transformerTotal ? data.lstmScores.name : data.transformerScores.name
  const accuracyDiff = Math.abs(data.lstmScores.scores[0] - data.transformerScores.scores[0]).toFixed(1)

  return (
    <Card className="panel-card" bordered={false}>
      <Title level={4}>模型准确率雷达</Title>
      <Row gutter={[32, 16]} align="middle">
        <Col span={16}>
          <Row>
            <Col span={12}>
              <Title level={5} style={{ textAlign: 'center' }}>
                {data.lstmScores.name}
              </Title>
              <ModelScoreRadar
                modelName={data.lstmScores.name}
                scores={data.lstmScores.scores}
              />
            </Col>
            <Col span={12}>
              <Title level={5} style={{ textAlign: 'center' }}>
                {data.transformerScores.name}
              </Title>
              <ModelScoreRadar
                modelName={data.transformerScores.name}
                scores={data.transformerScores.scores}
              />
            </Col>
          </Row>
        </Col>
        <Col span={8}>
          <Divider type="vertical" style={{ height: '100%' }} />
          <div style={{ paddingLeft: '24px' }}>
            <Title level={5}>系统推荐</Title>
            <Paragraph>
              根据当前场景下的综合评分，系统推荐使用{' '}
              <Text strong style={{ color: '#4cc3ff' }}>
                {recommendedModel}
              </Text>{' '}
              模型。
            </Paragraph>
            <Paragraph>
              其 <Text strong>准确性</Text> 指标相较另一模型高出约{' '}
              <Text strong>{accuracyDiff}%</Text>。
            </Paragraph>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

export default ModelArena
