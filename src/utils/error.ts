/**
 * 错误处理工具
 */

import type { ErrorInfo } from '../types'

/**
 * 处理错误信息
 */
export function handleError(error: ErrorInfo): void {
  console.error('Error:', error)

  // 这里可以根据需要添加错误上报、用户提示等逻辑
  // 例如：显示 toast 消息、发送错误日志到服务器等

  // 简单的控制台输出
  if (error.message) {
    // 可以集成 toast 库显示用户友好的错误消息
    // toast.error(error.message)
  }
}

/**
 * 格式化错误信息
 */
export function formatError(error: unknown): ErrorInfo {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ErrorInfo
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
    }
  }

  return {
    code: 'UNKNOWN',
    message: '未知错误',
  }
}

/**
 * 创建错误对象
 */
export function createError(code: number | string, message: string, details?: unknown): ErrorInfo {
  return {
    code,
    message,
    details,
  }
}
