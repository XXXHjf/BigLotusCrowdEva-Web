/**
 * 热力图组件 - 显示区块-时间热力图
 */

import ReactECharts from 'echarts-for-react'
import type { HeatmapDataPoint, Zone } from '../types/chart'

interface HeatmapChartProps {
  data: HeatmapDataPoint[]
  zones: Zone[]
  times: string[]
  onZoneClick?: (zoneId: string) => void
  selectedZone?: string // 用于高亮显示选中的区块
}

export function HeatmapChart({ data, zones, times, onZoneClick }: HeatmapChartProps) {
  // 准备热力图数据
  const heatmapData = data.map((item) => [
    times.indexOf(item.time),
    zones.findIndex((z) => z.id === item.zone),
    item.value,
  ])

  // 找出数值范围用于颜色映射
  const values = data.map((d) => d.value)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: unknown) => {
        const param = params as { data: [number, number, number] }
        const timeIndex = param.data[0]
        const zoneIndex = param.data[1]
        const value = param.data[2]
        return `${zones[zoneIndex].label}<br/>${times[timeIndex]}<br/>人数: ${value}`
      },
    },
    grid: {
      height: '85%',
      top: '5%',
      left: '8%',
      right: '8%',
      bottom: '5%',
    },
    xAxis: {
      type: 'category',
      data: times.map((time) => {
        const date = new Date(time)
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }),
      splitArea: {
        show: true,
      },
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'category',
      data: zones.map((z) => z.label),
      splitArea: {
        show: true,
      },
      axisLabel: {
        fontSize: 11,
      },
    },
    visualMap: {
      min: minValue,
      max: maxValue,
      calculable: true,
      orient: 'vertical',
      left: 'right',
      top: 'center',
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffcc',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026',
        ],
      },
      text: ['高', '低'],
      textStyle: {
        color: '#333',
      },
    },
    series: [
      {
        name: '人流密度',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }

  const onEvents = {
    click: (params: unknown) => {
      const param = params as { data: [number, number, number] }
      const zoneIndex = param.data[1]
      const zoneId = zones[zoneIndex].id
      onZoneClick?.(zoneId)
    },
  }

  return (
    <div style={{ width: '100%', height: '100%', padding: 0 }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} onEvents={onEvents} />
    </div>
  )
}
