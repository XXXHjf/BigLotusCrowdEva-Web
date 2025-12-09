// src/components/ConfidenceBandChart.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

interface ConfidenceBandChartProps {
  data: {
    historyData: (string | number)[][]
    predictionData: (string | number)[][]
    lowerBound: (string | number)[][]
    upperBound: (string | number)[][]
  }
}

const ConfidenceBandChart = ({ data }: ConfidenceBandChartProps) => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const axisColor = mode === 'dark' ? '#9fb3d9' : '#4a5a73'
  const gridColor = mode === 'dark' ? 'rgba(76, 195, 255, 0.2)' : '#e2e8f2'

  // 防御性守卫，确保数据有效
  if (!data || !data.historyData || !data.predictionData) {
    return null; // 或者返回一个加载中的提示
  }

  const xAxisData = data.historyData.map(item => item[0]).concat(data.predictionData.slice(1).map(item => item[0]));

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    legend: {
      data: ['历史数据', '预测数据', '置信区间'],
      textStyle: { color: textColor },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: axisColor },
        splitLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '人流量',
        axisLine: { lineStyle: { color: axisColor } },
        axisLabel: { color: axisColor },
        splitLine: {
          lineStyle: { color: gridColor },
        },
      },
    ],
    series: [
      {
        name: '历史数据',
        type: 'line',
        data: data.historyData,
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '预测数据',
        type: 'line',
        data: data.predictionData,
        lineStyle: { type: 'dashed', color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '置信区间下限',
        type: 'line',
        data: data.lowerBound,
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence-band',
      },
      {
        name: '置信区间',
        type: 'line',
        data: data.upperBound,
        lineStyle: { opacity: 0 },
        symbol: 'none',
        stack: 'confidence-band',
        areaStyle: {
          color: '#52c41a',
          opacity: 0.2,
        },
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        notMerge={true}
      />
    </div>
  )
}

export default ConfidenceBandChart
