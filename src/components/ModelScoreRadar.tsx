// src/components/ModelScoreRadar.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

interface RadarSeries {
  name: string
  values: number[]
  color: string
  areaColor: string
}

interface ModelScoreRadarProps {
  indicators: string[]
  series: RadarSeries[]
}

const ModelScoreRadar = ({ indicators, series }: ModelScoreRadarProps) => {
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
    legend: {
      top: 0,
      textStyle: { color: textColor, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    radar: {
      indicator: indicators.map((name) => ({ name, max: 100 })),
      radius: '70%',
      center: ['50%', '56%'],
      axisName: {
        color: textColor,
        fontWeight: 600,
        fontSize: 11,
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
        data: series.map((item) => ({
          value: item.values,
          name: item.name,
          areaStyle: { color: item.areaColor },
          lineStyle: { color: item.color, width: 2 },
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: item.color },
        })),
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} style={{ width: '100%', height: '240px' }} notMerge />
    </div>
  )
}

export default ModelScoreRadar
