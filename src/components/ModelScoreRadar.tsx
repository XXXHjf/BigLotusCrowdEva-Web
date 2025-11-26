// src/components/ModelScoreRadar.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'

interface ModelScoreRadarProps {
  modelName: string
  scores: number[]
}

const ModelScoreRadar = ({ modelName, scores }: ModelScoreRadarProps) => {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: '准确性', max: 100 },
        { name: '响应速度', max: 100 },
        { name: '抗噪能力', max: 100 },
      ],
      radius: '80%',
      center: ['50%', '60%'],
      axisName: {
        color: '#d8e6ff',
        fontWeight: 600,
        fontSize: 12,
      },
      axisLine: {
        lineStyle: { color: 'rgba(76, 195, 255, 0.4)' },
      },
      splitLine: {
        lineStyle: {
          color: ['rgba(76, 195, 255, 0.25)', 'rgba(126, 87, 194, 0.2)'],
          type: 'dashed',
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(76, 195, 255, 0.05)', 'rgba(126, 87, 194, 0.04)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: scores,
            name: modelName,
            areaStyle: { color: 'rgba(76, 195, 255, 0.25)' },
            lineStyle: { color: '#4cc3ff', width: 2 },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#4cc3ff' },
          },
        ],
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '200px' }}
        notMerge={true}
      />
    </div>
  )
}

export default ModelScoreRadar
