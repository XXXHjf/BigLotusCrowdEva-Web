/**
 * 对比折线图组件 - 显示多个模型的预测结果对比
 */

import ReactECharts from 'echarts-for-react'
import type { ModelPrediction } from '../types/chart'
import { CHART_DEFAULTS } from '../constants'

interface ComparisonLineChartProps {
  predictions: ModelPrediction[]
  zoneLabel?: string
}

export function ComparisonLineChart({ predictions, zoneLabel }: ComparisonLineChartProps) {
  if (predictions.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#999',
        }}
      >
        请点击热力图选择区块查看预测结果
      </div>
    )
  }

  // 准备图表数据
  const firstModelData = predictions[0]?.data || []
  const xAxisData = firstModelData.map((item) => {
    const date = new Date(item.time)
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  })

  const series = predictions.map((prediction, index) => ({
    name: prediction.modelName,
    type: 'line',
    data: prediction.data.map((item) => item.value),
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    lineStyle: {
      width: 2,
    },
    itemStyle: {
      color: CHART_DEFAULTS.COLOR_PALETTE[index % CHART_DEFAULTS.COLOR_PALETTE.length],
    },
  }))

  const option = {
    tooltip: {
      ...CHART_DEFAULTS.TOOLTIP,
      trigger: 'axis',
    },
    legend: {
      data: predictions.map((p) => p.modelName),
      top: 5,
      textStyle: {
        fontSize: 10,
      },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: {
      left: '8%',
      right: '8%',
      top: '10%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLabel: {
        fontSize: 10,
        rotate: 45,
      },
      name: '时间',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: '人数',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        fontSize: 10,
      },
    },
    series,
  }

  return (
    <div style={{ width: '100%', height: '100%', padding: 0 }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
