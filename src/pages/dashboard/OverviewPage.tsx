// src/pages/dashboard/OverviewPage.tsx
import { Row, Col, Card } from 'antd'
import CrowdDensityHeatmap from '../../components/CrowdDensityHeatmap'

const OverviewPage = () => {
  return (
    <div className="page-shell">
      <Row gutter={[16, 16]}>
        <Col lg={24} xs={24}>
          <Card
            title="人流热力地图"
            className="panel-card"
            bordered={false}
            style={{ minHeight: 'calc(100vh - 180px)', height: 'calc(100vh - 180px)' }}
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', display: 'flex' }}
          >
            <CrowdDensityHeatmap />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default OverviewPage
