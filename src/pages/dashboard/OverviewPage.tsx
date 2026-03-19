// src/pages/dashboard/OverviewPage.tsx
import { Row, Col, Card } from 'antd'
import CrowdDensityHeatmap from '../../components/CrowdDensityHeatmap'

const OverviewPage = () => {
  return (
    <div className="page-shell">
      <Row gutter={[16, 16]} style={{ flex: 1 }}>
        <Col lg={24} xs={24} style={{ height: '100%' }}>
          <Card
            title="人流热力地图"
            className="panel-card"
            bordered={false}
            style={{ height: '100%' }}
            bodyStyle={{ height: 'calc(100% - 58px)', padding: 0 }}
          >
            <CrowdDensityHeatmap />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default OverviewPage
