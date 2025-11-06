/**
 * 项目常量定义
 */

/**
 * API 基础配置
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000, // 30秒
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * 错误消息
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT: '请求超时，请稍后重试',
  UNKNOWN_ERROR: '未知错误，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  NOT_FOUND: '请求的资源不存在',
  UNAUTHORIZED: '未授权，请先登录',
  FORBIDDEN: '无权限访问',
} as const

/**
 * 时间格式化格式
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  TIMESTAMP: 'YYYY-MM-DD HH:mm',
} as const

/**
 * 图表默认配置
 */
export const CHART_DEFAULTS = {
  COLOR_PALETTE: [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4',
    '#ea7ccc',
  ],
  GRID: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  TOOLTIP: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
    },
  },
} as const

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

/**
 * 分页默认值
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const
