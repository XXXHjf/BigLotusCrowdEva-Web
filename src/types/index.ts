/**
 * 通用类型定义
 */

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  success: boolean
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 时间范围
 */
export interface TimeRange {
  startTime: string | Date
  endTime: string | Date
}

/**
 * 人群预测数据
 */
export interface CrowdPrediction {
  timestamp: string | number
  predictedCount: number
  actualCount?: number
  confidence?: number
  location?: string
}

/**
 * 人群走势数据点
 */
export interface CrowdDataPoint {
  time: string
  value: number
  type?: 'predicted' | 'actual'
}

/**
 * 图表配置项
 */
export interface ChartOption {
  title?: unknown
  xAxis?: unknown
  yAxis?: unknown
  series?: unknown[]
  tooltip?: unknown
  legend?: unknown
  grid?: unknown
  visualMap?: unknown
}

/**
 * 请求配置
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number
  showError?: boolean
}

/**
 * 错误信息
 */
export interface ErrorInfo {
  code: number | string
  message: string
  details?: unknown
}
