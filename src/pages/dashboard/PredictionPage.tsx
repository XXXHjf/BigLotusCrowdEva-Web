// src/pages/dashboard/PredictionPage.tsx
import { Card, Col, Row } from 'antd'
import ConfidenceBandChart from '../../components/ConfidenceBandChart'
import ModelArena from '../../components/ModelArena'
import {
  generatePredictionDataWithBounds,
  generateModelScores,
} from '../../utils/mockData'
import { useDynamicData } from '../../hooks/useDynamicData'

const PredictionPage = () => {
  const predictionData = useDynamicData(generatePredictionDataWithBounds, 10000)
  const modelScores = useDynamicData(generateModelScores, 10000)

  return (
    <div className="page-shell">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="未来一小时人流量预测（含置信区间）"
            className="panel-card"
            bordered={false}
          >
            <div style={{ height: '400px' }}>
              <ConfidenceBandChart data={predictionData} />
            </div>
          </Card>
        </Col>
        <Col span={24}>
          <ModelArena data={modelScores} />
        </Col>
      </Row>
    </div>
  )
}

export default PredictionPage
