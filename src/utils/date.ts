/**
 * 日期时间工具函数
 */

import { DATE_FORMATS } from '../constants'

/**
 * 格式化日期
 */
export function formatDate(
  date: string | Date | number,
  format: string = DATE_FORMATS.DATETIME,
): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return ''
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: string | Date | number): string {
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  }
  if (hours > 0) {
    return `${hours}小时前`
  }
  if (minutes > 0) {
    return `${minutes}分钟前`
  }
  return '刚刚'
}

/**
 * 获取时间范围
 */
export function getTimeRange(
  type: 'today' | 'yesterday' | 'week' | 'month' | 'custom',
  customStart?: Date,
  customEnd?: Date,
): { startTime: Date; endTime: Date } {
  const now = new Date()
  let startTime: Date
  let endTime: Date = new Date(now.setHours(23, 59, 59, 999))

  switch (type) {
    case 'today':
      startTime = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startTime = new Date(yesterday.setHours(0, 0, 0, 0))
      endTime = new Date(yesterday.setHours(23, 59, 59, 999))
      break
    case 'week':
      startTime = new Date(now.setDate(now.getDate() - 7))
      startTime.setHours(0, 0, 0, 0)
      break
    case 'month':
      startTime = new Date(now.setMonth(now.getMonth() - 1))
      startTime.setHours(0, 0, 0, 0)
      break
    case 'custom':
      if (customStart && customEnd) {
        startTime = customStart
        endTime = customEnd
      } else {
        startTime = new Date(now.setHours(0, 0, 0, 0))
      }
      break
    default:
      startTime = new Date(now.setHours(0, 0, 0, 0))
  }

  return { startTime, endTime }
}

/**
 * 判断是否为同一天
 */
export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * 时间戳转换
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000)
}

/**
 * 日期转时间戳（秒）
 */
export function dateToTimestamp(date: Date | string): number {
  return Math.floor(new Date(date).getTime() / 1000)
}
