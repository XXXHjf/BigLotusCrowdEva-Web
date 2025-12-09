// src/components/ModelScoreRadar.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

interface ModelScoreRadarProps {
  modelName: string
  scores: number[]
}

const ModelScoreRadar = ({ modelName, scores }: ModelScoreRadarProps) => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const axisColor = mode === 'dark' ? 'rgba(76, 195, 255, 0.4)' : '#8aa0bf'
  const splitLineColor =
    mode === 'dark'
      ? ['rgba(76, 195, 255, 0.25)', 'rgba(126, 87, 194, 0.2)']
      : ['rgba(76, 195, 255, 0.18)', 'rgba(126, 87, 194, 0.12)']
  const splitAreaColor =
    mode === 'dark'
      ? ['rgba(76, 195, 255, 0.05)', 'rgba(126, 87, 194, 0.04)']
      : ['rgba(76, 195, 255, 0.08)', 'rgba(126, 87, 194, 0.06)']

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
        color: textColor,
        fontWeight: 600,
        fontSize: 12,
      },
      axisLine: {
        lineStyle: { color: axisColor },
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: 'dashed',
        },
      },
      splitArea: {
        areaStyle: {
          color: splitAreaColor,
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
