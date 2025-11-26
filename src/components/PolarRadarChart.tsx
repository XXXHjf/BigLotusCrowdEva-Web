// src/components/PolarRadarChart.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { useState, useEffect, useMemo } from 'react'

const mockClusters = [
  { id: 'c1', r: 0.8, theta: 45, value: 520, level: 'danger' },
  { id: 'c2', r: 0.6, theta: 120, value: 210, level: 'warning' },
  { id: 'c3', r: 0.9, theta: 210, value: 150, level: 'safe' },
  { id: 'c4', r: 0.3, theta: 300, value: 80, level: 'safe' },
  { id: 'c5', r: 0.75, theta: 15, value: 300, level: 'warning' },
]

const colorMap: Record<string, string> = {
  safe: '#52c41a',
  warning: '#faad14',
  danger: '#ff6b6b',
}

const getInitialOption = (data: any[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: ({ data }: any) => `人数: ${data.value[2]}`,
  },
  polar: {
    radius: ['5%', '85%'],
    center: ['50%', '50%'],
  },
  angleAxis: {
    startAngle: 90,
    min: 0,
    max: 360,
    interval: 45,
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      show: true,
      lineStyle: {
        color: 'rgba(76, 195, 255, 0.25)',
        type: 'dashed',
      },
    },
  },
  radiusAxis: {
    type: 'value',
    min: 0,
    max: 1,
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.08)',
        type: 'dashed',
      },
    },
  },
  series: [
    {
      name: '人群聚类',
      type: 'scatter',
      coordinateSystem: 'polar',
      symbolSize: (val: number[]) => Math.max(5, Math.sqrt(val[2]) / 1.5),
      data: data,
      itemStyle: {
        shadowBlur: 12,
        shadowColor: 'rgba(76, 195, 255, 0.35)',
      },
      emphasis: {
        scale: 1.2,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    },
  ],
})

const PolarRadarChart = () => {
  const initialData = useMemo(() => mockClusters.map((cluster) => ({
      name: cluster.id,
      value: [cluster.theta, cluster.r, cluster.value],
      itemStyle: {
        color: colorMap[cluster.level],
      },
    })), [])

  const [chartOption, setChartOption] = useState<EChartsOption>(() => getInitialOption(initialData));

  useEffect(() => {
    let startAngle = 90
    const interval = setInterval(() => {
      startAngle -= 1
      setChartOption(prevOption => {
        const prevSeries = Array.isArray(prevOption.series) ? prevOption.series : []
        const fallbackScatter = (getInitialOption(initialData).series as any[])[0]
        const scatterSeries = prevSeries[0] || fallbackScatter
        return ({
          ...prevOption,
          series: [
              scatterSeries as any, // 保留散点层
              {
                  name: 'scan',
                  type: 'pie',
                  radius: ['0%', '90%'],
                  center: ['50%', '50%'],
                  startAngle: startAngle,
                  silent: true,
                  z: 0,
                  data: [
                    {
                      value: 60,
                      itemStyle: {
                        color: {
                          type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(82, 196, 26, 0)' },
                            { offset: 1, color: 'rgba(82, 196, 26, 0.3)' },
                          ],
                        },
                      },
                    },
                    {
                      value: 300,
                      itemStyle: { color: 'transparent' },
                    },
                  ],
                  animation: false,
              }
          ]
        })
      })
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={chartOption}
        style={{ width: '100%', height: '100%' }}
        notMerge={false}
      />
    </div>
  )
}

export default PolarRadarChart

// ... (rest of the file with mock data)
