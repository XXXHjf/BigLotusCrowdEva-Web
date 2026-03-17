// src/components/ConfidenceBandChart.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

interface TrendComparisonPoint {
  time: string
  actual: number
  predicted: number
  lower: number
  upper: number
}

interface ConfidenceBandChartProps {
  data: TrendComparisonPoint[]
}

const BAND_SHRINK_FACTOR = 0.6

const ConfidenceBandChart = ({ data }: ConfidenceBandChartProps) => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const axisColor = mode === 'dark' ? '#9fb3d9' : '#4a5a73'
  const gridColor = mode === 'dark' ? 'rgba(76, 195, 255, 0.2)' : '#e2e8f2'

  if (!data || data.length === 0) {
    return null
  }

  const xAxisData = data.map((item) => item.time)
  const actualData = data.map((item) => item.actual)
  const predictedData = data.map((item) => item.predicted)

  const narrowedLower = data.map((item) => {
    const delta = item.predicted - item.lower
    return Number((item.predicted - delta * BAND_SHRINK_FACTOR).toFixed(2))
  })

  const narrowedUpper = data.map((item) => {
    const delta = item.upper - item.predicted
    return Number((item.predicted + delta * BAND_SHRINK_FACTOR).toFixed(2))
  })

  const bandRange = narrowedUpper.map((upper, index) =>
    Number((upper - narrowedLower[index]).toFixed(2)),
  )

  const coreValues = [...actualData, ...predictedData, ...narrowedLower, ...narrowedUpper]
  const coreMin = Math.min(...coreValues)
  const coreMax = Math.max(...coreValues)
  const coreSpan = Math.max(coreMax - coreMin, 1)
  const yPadding = Math.max(coreSpan * 0.08, 6)
  const yMin = Math.floor(coreMin - yPadding)
  const yMax = Math.ceil(coreMax + yPadding)

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['真实数据', '预测数据', '置信区间'],
      top: 6,
      textStyle: { color: textColor },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 48,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: axisColor },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '人流量',
      min: yMin,
      max: yMax,
      scale: true,
      axisLine: { lineStyle: { color: axisColor } },
      axisLabel: { color: axisColor },
      splitLine: {
        lineStyle: { color: gridColor },
      },
    },
    series: [
      {
        name: '真实数据',
        type: 'line',
        data: actualData,
        smooth: 0.25,
        lineStyle: { color: '#4cc3ff', width: 2.4 },
        itemStyle: { color: '#4cc3ff' },
        symbol: 'circle',
        symbolSize: 5,
      },
      {
        name: '预测数据',
        type: 'line',
        data: predictedData,
        smooth: 0.25,
        lineStyle: { type: 'dashed', color: '#5ad8a6', width: 2.2 },
        itemStyle: { color: '#5ad8a6' },
        symbol: 'diamond',
        symbolSize: 5,
      },
      {
        name: '置信区间下限',
        type: 'line',
        data: narrowedLower,
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence-band',
        tooltip: { show: false },
      },
      {
        name: '置信区间',
        type: 'line',
        data: bandRange,
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence-band',
        areaStyle: {
          color: '#5ad8a6',
          opacity: 0.12,
        },
        tooltip: { show: false },
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} notMerge />
    </div>
  )
}

export default ConfidenceBandChart
