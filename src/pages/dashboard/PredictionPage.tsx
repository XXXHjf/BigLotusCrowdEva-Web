// src/pages/dashboard/PredictionPage.tsx
import { useEffect, useState } from 'react'
import { Card, Col, Row } from 'antd'
import ConfidenceBandChart from '../../components/ConfidenceBandChart'
import ModelArena from '../../components/ModelArena'
import { getAugmentationMainResultsData, getTrendComparisonData } from '../../api/dataService'

interface TrendComparisonPoint {
  time: string
  actual: number
  predicted: number
  lower: number
  upper: number
}

interface TrendComparisonResponse {
  points: TrendComparisonPoint[]
}

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

interface AugmentationMainResultsResponse {
  strategies: StrategyDef[]
  models: ModelMetricRow[]
}

const PredictionPage = () => {
  const [predictionData, setPredictionData] = useState<TrendComparisonPoint[]>([])
  const [arenaData, setArenaData] = useState<AugmentationMainResultsResponse>({
    strategies: [],
    models: [],
  })

  useEffect(() => {
    let mounted = true
    getTrendComparisonData<TrendComparisonResponse>()
      .then((res) => {
        if (!mounted) return
        setPredictionData(res.points || [])
      })
      .catch(() => {
        if (!mounted) return
        setPredictionData([])
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    getAugmentationMainResultsData<AugmentationMainResultsResponse>()
      .then((res) => {
        if (!mounted) return
        setArenaData({
          strategies: res.strategies || [],
          models: res.models || [],
        })
      })
      .catch(() => {
        if (!mounted) return
        setArenaData({ strategies: [], models: [] })
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="page-shell">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="流量趋势对比"
            className="panel-card"
            bordered={false}
          >
            <div style={{ height: '400px' }}>
              <ConfidenceBandChart data={predictionData} />
            </div>
          </Card>
        </Col>
        <Col span={24}>
          <ModelArena data={arenaData} />
        </Col>
      </Row>
    </div>
  )
}

export default PredictionPage
