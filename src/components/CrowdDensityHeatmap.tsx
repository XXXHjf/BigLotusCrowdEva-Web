// src/components/CrowdDensityHeatmap.tsx
import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

const zones = [
  { id: 'north', label: '北广场' },
  { id: 'east', label: '东入口' },
  { id: 'west', label: '西入口' },
  { id: 'stand-a', label: '看台 A' },
  { id: 'stand-b', label: '看台 B' },
  { id: 'catering', label: '餐饮区' },
]

const buildTimeline = () => {
  const now = Date.now()
  // 取最近 60 分钟的 10 分钟粒度
  return Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * 10 * 60 * 1000))
}

const generateMockData = (times: Date[]) => {
  const data: [number, number, number][] = []
  times.forEach((_, xIndex) => {
    zones.forEach((zone, yIndex) => {
      // 简单模拟：入口和看台略高，餐饮区在中段峰值
      const base =
        zone.id.includes('入口') ? 240 : zone.id.includes('stand') ? 200 : 160
      const wave = 80 * Math.sin((xIndex / times.length) * Math.PI * 1.2) + 100
      const noise = Math.random() * 60
      const value = Math.round(base + wave + noise)
      data.push([xIndex, yIndex, value])
    })
  })
  return data
}

const CrowdDensityHeatmap = () => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const axisColor = mode === 'dark' ? '#9fb3d9' : '#4a5a73'
  const gridLineColor = mode === 'dark' ? 'rgba(76, 195, 255, 0.35)' : '#dce4f2'
  const visualColors =
    mode === 'dark'
      ? ['#0a1c36', '#0f5b9c', '#4cc3ff', '#7ef6ff', '#ff9f7f']
      : ['#d7e9ff', '#8ecbff', '#4cc3ff', '#ffb48f', '#ff7f7f']

  const times = useMemo(() => buildTimeline(), [])
  const data = useMemo(() => generateMockData(times), [times])

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [xIndex, yIndex, value] = params.data as [number, number, number]
        const time = times[xIndex]
        const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
        return `${zones[yIndex].label}<br/>${hhmm}<br/>人数: ${value}`
      },
      borderColor: '#1f2d4d',
      backgroundColor: 'rgba(7, 15, 31, 0.92)',
    },
    grid: {
      height: '82%',
      top: '8%',
      left: '6%',
      right: '10%',
      bottom: '6%',
    },
    xAxis: {
      type: 'category',
      data: times.map((time) => {
        return `${String(time.getHours()).padStart(2, '0')}:${String(
          time.getMinutes(),
        ).padStart(2, '0')}`
      }),
      axisLabel: {
        color: axisColor,
      },
      axisLine: {
        lineStyle: { color: gridLineColor },
      },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: zones.map((z) => z.label),
      axisLabel: {
        color: textColor,
      },
      axisLine: {
        lineStyle: { color: gridLineColor },
      },
      splitArea: { show: false },
    },
    visualMap: {
      min: Math.min(...data.map((d) => d[2])),
      max: Math.max(...data.map((d) => d[2])),
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'middle',
      inRange: {
        color: visualColors,
      },
      text: ['高', '低'],
      textStyle: { color: textColor },
      itemHeight: 140,
      itemWidth: 12,
      borderColor: 'rgba(76, 195, 255, 0.25)',
    },
    series: [
      {
        name: '人流密度',
        type: 'heatmap',
        data,
        label: { show: false },
        itemStyle: {
          borderWidth: 1,
          borderColor: 'rgba(10, 20, 40, 0.6)',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 14,
            shadowColor: 'rgba(76, 195, 255, 0.35)',
            borderColor: '#4cc3ff',
          },
        },
        animation: true,
        progressive: 0,
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default CrowdDensityHeatmap
