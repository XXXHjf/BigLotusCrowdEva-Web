/**
 * API 请求封装
 */
import type { ApiResponse, RequestConfig, ErrorInfo } from '../types'
import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '../constants'
import { handleError } from '../utils/error'

/**
 * 请求类
 */
class Request {
  private baseURL: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS
  }

  /**
   * 获取请求头
   */
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    return { ...this.defaultHeaders, ...customHeaders }
  }

  /**
   * 构建请求 URL
   */
  private buildURL(url: string, params?: Record<string, unknown>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`

    if (!params) return fullURL

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${fullURL}?${queryString}` : fullURL
  }

  /**
   * 执行请求
   */
  private async execute<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers: customHeaders,
      params,
      data,
      timeout = this.timeout,
      showError = true,
    } = config

    const requestURL = this.buildURL(url, params)
    const headers = this.getHeaders(customHeaders)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const fetchConfig: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      }

      if (data && method !== 'GET') {
        fetchConfig.body = JSON.stringify(data)
      }

      const response = await fetch(requestURL, fetchConfig)
      clearTimeout(timeoutId)

      // 处理 HTTP 状态码
      if (!response.ok) {
        const errorInfo = await this.handleHTTPError(response)
        if (showError) {
          handleError(errorInfo)
        }
        throw errorInfo
      }

      const result: ApiResponse<T> = await response.json()

      // 处理业务错误
      if (!result.success && result.code !== HTTP_STATUS.OK) {
        const errorInfo: ErrorInfo = {
          code: result.code,
          message: result.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        }
        if (showError) {
          handleError(errorInfo)
        }
        throw errorInfo
      }

      return result
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const errorInfo: ErrorInfo = {
            code: 'TIMEOUT',
            message: ERROR_MESSAGES.TIMEOUT,
          }
          if (showError) {
            handleError(errorInfo)
          }
          throw errorInfo
        }

        if (error.message.includes('Failed to fetch')) {
          const errorInfo: ErrorInfo = {
            code: 'NETWORK_ERROR',
            message: ERROR_MESSAGES.NETWORK_ERROR,
          }
          if (showError) {
            handleError(errorInfo)
          }
          throw errorInfo
        }
      }

      throw error
    }
  }

  /**
   * 处理 HTTP 错误
   */
  private async handleHTTPError(response: Response): Promise<ErrorInfo> {
    let message: string = ERROR_MESSAGES.UNKNOWN_ERROR

    switch (response.status) {
      case HTTP_STATUS.NOT_FOUND:
        message = ERROR_MESSAGES.NOT_FOUND
        break
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        message = ERROR_MESSAGES.SERVER_ERROR
        break
      default:
        try {
          const errorData = await response.json()
          message = errorData.message || message
        } catch {
          // 如果无法解析 JSON，使用默认消息
        }
    }

    return {
      code: response.status,
      message,
    }
  }

  /**
   * GET 请求
   */
  get<T = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.execute<T>(url, { ...config, method: 'GET' })
  }

  /**
   * POST 请求
   */
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.execute<T>(url, { ...config, method: 'POST', data })
  }

  /**
   * PUT 请求
   */
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.execute<T>(url, { ...config, method: 'PUT', data })
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(
    url: string,
    config?: Omit<RequestConfig, 'method' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.execute<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * PATCH 请求
   */
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestConfig, 'method' | 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.execute<T>(url, { ...config, method: 'PATCH', data })
  }
}

// 导出单例实例
export const request = new Request()

// 导出默认请求实例
export default request
