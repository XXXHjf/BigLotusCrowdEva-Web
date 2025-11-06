/**
 * ECharts 图表工具函数
 */

import type { ChartOption, CrowdDataPoint } from '../types'
import { CHART_DEFAULTS, DATE_FORMATS } from '../constants'
import { formatDate } from './date'

/**
 * 创建基础折线图配置
 */
export function createLineChartOption(
  title: string,
  data: CrowdDataPoint[],
  xAxisLabel?: string,
  yAxisLabel?: string,
): ChartOption {
  const xAxisData = data.map((item) => formatDate(item.time, DATE_FORMATS.TIMESTAMP))
  const seriesData = data.map((item) => item.value)

  return {
    title: {
      text: title,
      left: 'center',
    },
    tooltip: {
      ...CHART_DEFAULTS.TOOLTIP,
    },
    grid: {
      ...CHART_DEFAULTS.GRID,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: xAxisLabel || '时间',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel || '人数',
    },
    series: [
      {
        name: '人数',
        type: 'line',
        data: seriesData,
        smooth: true,
        itemStyle: {
          color: CHART_DEFAULTS.COLOR_PALETTE[0],
        },
        areaStyle: {
          opacity: 0.3,
        },
      },
    ],
  }
}

/**
 * 创建对比折线图配置（预测 vs 实际）
 */
export function createComparisonChartOption(
  title: string,
  predictedData: CrowdDataPoint[],
  actualData?: CrowdDataPoint[],
): ChartOption {
  const xAxisData = predictedData.map((item) => formatDate(item.time, DATE_FORMATS.TIMESTAMP))
  const predictedSeries = predictedData.map((item) => item.value)
  const actualSeries = actualData?.map((item) => item.value) || []

  return {
    title: {
      text: title,
      left: 'center',
    },
    tooltip: {
      ...CHART_DEFAULTS.TOOLTIP,
    },
    legend: {
      data: ['预测值', '实际值'],
      top: 30,
    },
    grid: {
      ...CHART_DEFAULTS.GRID,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: '时间',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: '人数',
    },
    series: [
      {
        name: '预测值',
        type: 'line',
        data: predictedSeries,
        smooth: true,
        itemStyle: {
          color: CHART_DEFAULTS.COLOR_PALETTE[0],
        },
        lineStyle: {
          type: 'dashed',
        },
      },
      ...(actualSeries.length > 0
        ? [
            {
              name: '实际值',
              type: 'line',
              data: actualSeries,
              smooth: true,
              itemStyle: {
                color: CHART_DEFAULTS.COLOR_PALETTE[1],
              },
            },
          ]
        : []),
    ],
  }
}

/**
 * 创建柱状图配置
 */
export function createBarChartOption(
  title: string,
  data: CrowdDataPoint[],
  xAxisLabel?: string,
  yAxisLabel?: string,
): ChartOption {
  const xAxisData = data.map((item) => formatDate(item.time, DATE_FORMATS.TIMESTAMP))
  const seriesData = data.map((item) => item.value)

  return {
    title: {
      text: title,
      left: 'center',
    },
    tooltip: {
      ...CHART_DEFAULTS.TOOLTIP,
    },
    grid: {
      ...CHART_DEFAULTS.GRID,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: xAxisLabel || '时间',
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel || '人数',
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: seriesData,
        itemStyle: {
          color: CHART_DEFAULTS.COLOR_PALETTE[0],
        },
      },
    ],
  }
}

/**
 * 创建响应式图表配置
 */
export function createResponsiveChartOption(baseOption: ChartOption): ChartOption {
  // 可以根据屏幕尺寸调整图表配置
  const isMobile = window.innerWidth < 768

  return {
    ...baseOption,
    grid: {
      ...CHART_DEFAULTS.GRID,
      left: isMobile ? '5%' : '3%',
      right: isMobile ? '5%' : '4%',
    },
    title: baseOption.title
      ? {
          ...(baseOption.title as Record<string, unknown>),
          textStyle: {
            fontSize: isMobile ? 14 : 16,
          },
        }
      : {
          textStyle: {
            fontSize: isMobile ? 14 : 16,
          },
        },
  }
}
