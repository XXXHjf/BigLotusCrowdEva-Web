/**
 * 人群预测相关 API 接口
 */

import { request } from './request'
import type { ApiResponse, CrowdPrediction, CrowdDataPoint, TimeRange } from '../types'

/**
 * 获取人群预测数据
 */
export async function getCrowdPredictions(
  params: TimeRange & { location?: string },
): Promise<ApiResponse<CrowdPrediction[]>> {
  return request.get<CrowdPrediction[]>('/crowd/predictions', {
    params: params as unknown as Record<string, unknown>,
  })
}

/**
 * 获取人群走势数据
 */
export async function getCrowdTrends(
  params: TimeRange & { location?: string },
): Promise<ApiResponse<CrowdDataPoint[]>> {
  return request.get<CrowdDataPoint[]>('/crowd/trends', {
    params: params as unknown as Record<string, unknown>,
  })
}

/**
 * 获取实时人群数据
 */
export async function getRealTimeCrowdData(
  location?: string,
): Promise<ApiResponse<CrowdPrediction>> {
  return request.get<CrowdPrediction>('/crowd/realtime', {
    params: location ? { location } : undefined,
  })
}

/**
 * 提交实际人群数据（用于模型训练和改进）
 */
export async function submitActualCrowdData(data: {
  timestamp: string | number
  actualCount: number
  location?: string
}): Promise<ApiResponse<void>> {
  return request.post<void>('/crowd/actual', data)
}
