// src/components/ImpactAssessmentPanel.tsx
import { Alert, Card } from 'antd'

interface ImpactAssessmentPanelProps {
  result: string | null
}

const ImpactAssessmentPanel = ({ result }: ImpactAssessmentPanelProps) => {
  return (
    <Card title="影响评估" className="panel-card" bordered={false} style={{ minHeight: 220 }}>
      {result ? (
        <Alert
          message="模拟推演结果"
          description={result}
          type="warning"
          showIcon
        />
      ) : (
        <Alert
          message="提示"
          description="选择左侧节点并执行操作后，这里会显示推演影响评估。"
          type="info"
          showIcon
        />
      )}
    </Card>
  )
}

export default ImpactAssessmentPanel
