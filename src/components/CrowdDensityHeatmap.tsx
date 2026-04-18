import {
  AimOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Segmented, Slider, Spin } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getOverviewCrowdHeatmapData } from '../api/dataService'
import './CrowdDensityHeatmap.css'
import { useThemeMode } from '../context/ThemeContext'
import type {
  CrowdHeatmapFrame,
  CrowdHeatmapPlaybackData,
  CrowdHeatmapPoint,
} from '../types/crowdHeatmap'

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: {
      securityJsCode?: string
    }
  }
}

const DATA_PATH = '/data/overview/crowd-heatmap-30s-gcj02.json'
const BASE_FRAME_DURATION_MS = 900
const PLAYBACK_UPDATE_INTERVAL_MS = 100
const MAP_UPDATE_INTERVAL_MS = 120
const PLAYBACK_RATES = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
  { label: '8x', value: 8 },
]
const EMPTY_FRAMES: CrowdHeatmapFrame[] = []
const EMPTY_POINTS: CrowdHeatmapPoint[] = []
let retainedPlaybackPosition = 0
let retainedPlaybackRate = 1
let retainedWasPlaying = true

const formatFrameTime = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value))

const formatFrameTimeShort = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value))

const HEATMAP_COLOR_STOPS = [
  { stop: 0, color: [17, 70, 125] as const },
  { stop: 0.18, color: [27, 122, 194] as const },
  { stop: 0.36, color: [44, 212, 230] as const },
  { stop: 0.56, color: [151, 247, 159] as const },
  { stop: 0.76, color: [255, 214, 92] as const },
  { stop: 0.9, color: [255, 154, 72] as const },
  { stop: 1, color: [255, 84, 84] as const },
]

const interpolateChannel = (from: number, to: number, ratio: number) =>
  Math.round(from + (to - from) * ratio)

const resolveHeatColor = (value: number) => {
  const normalized = Math.max(0, Math.min(1, value))

  for (let index = 1; index < HEATMAP_COLOR_STOPS.length; index += 1) {
    const previous = HEATMAP_COLOR_STOPS[index - 1]
    const current = HEATMAP_COLOR_STOPS[index]
    if (normalized <= current.stop) {
      const range = current.stop - previous.stop || 1
      const ratio = (normalized - previous.stop) / range
      return [
        interpolateChannel(previous.color[0], current.color[0], ratio),
        interpolateChannel(previous.color[1], current.color[1], ratio),
        interpolateChannel(previous.color[2], current.color[2], ratio),
      ] as const
    }
  }

  return HEATMAP_COLOR_STOPS[HEATMAP_COLOR_STOPS.length - 1].color
}

const drawHeatPoint = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  normalizedValue: number,
  baseRadius: number,
) => {
  const clampedValue = Math.max(0, Math.min(1, normalizedValue))
  const radius = baseRadius * (0.78 + clampedValue * 0.68)
  const [red, green, blue] = resolveHeatColor(clampedValue)
  const innerAlpha = 0.18 + clampedValue * 0.4
  const outerAlpha = 0.06 + clampedValue * 0.12
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius)

  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${innerAlpha})`)
  gradient.addColorStop(0.4, `rgba(${red}, ${green}, ${blue}, ${outerAlpha})`)
  gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)

  context.fillStyle = gradient
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
}

const interpolatePoints = (
  fromPoints: CrowdHeatmapPoint[],
  toPoints: CrowdHeatmapPoint[],
  blend: number,
) => {
  const pointMap = new Map<
    string,
    { lng: number; lat: number; from?: number; to?: number }
  >()

  fromPoints.forEach(([lng, lat, value]) => {
    pointMap.set(`${lng.toFixed(6)},${lat.toFixed(6)}`, {
      lng,
      lat,
      from: value,
    })
  })

  toPoints.forEach(([lng, lat, value]) => {
    const key = `${lng.toFixed(6)},${lat.toFixed(6)}`
    const existing = pointMap.get(key)
    if (existing) {
      existing.to = value
      return
    }

    pointMap.set(key, {
      lng,
      lat,
      to: value,
    })
  })

  return Array.from(pointMap.values())
    .map(({ lng, lat, from, to }) => {
      let value = 0

      if (typeof from === 'number' && typeof to === 'number') {
        value = from + (to - from) * blend
      } else if (typeof from === 'number') {
        value = from
      } else if (typeof to === 'number') {
        value = to
      }

      return [lng, lat, Number(value.toFixed(2))] as CrowdHeatmapPoint
    })
    .filter((point) => point[2] > 0)
}

const resolveInitialView = (playbackData: CrowdHeatmapPlaybackData) => {
  const firstFramePoints = playbackData.frames[0]?.points ?? EMPTY_POINTS

  if (!firstFramePoints.length) {
    return {
      center: playbackData.meta.center,
      zoom: 16,
    }
  }

  const bounds = firstFramePoints.reduce(
    (result, [lng, lat]) => ({
      minLng: Math.min(result.minLng, lng),
      maxLng: Math.max(result.maxLng, lng),
      minLat: Math.min(result.minLat, lat),
      maxLat: Math.max(result.maxLat, lat),
    }),
    {
      minLng: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    },
  )

  return {
    center: [
      Number(((bounds.minLng + bounds.maxLng) / 2).toFixed(6)),
      Number(((bounds.minLat + bounds.maxLat) / 2).toFixed(6)),
    ] as [number, number],
    zoom: 16,
  }
}

const CrowdDensityHeatmap = () => {
  const { mode } = useThemeMode()
  const location = useLocation()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const mapRef = useRef<any>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTickRef = useRef<number | null>(null)
  const playbackAccumulatedMsRef = useRef(0)
  const lastMapUpdateRef = useRef(0)
  const latestPointsRef = useRef<CrowdHeatmapPoint[]>(EMPTY_POINTS)
  const latestGlobalMaxValueRef = useRef(1)
  const renderHeatmapRef = useRef<(() => void) | null>(null)
  const [playbackData, setPlaybackData] = useState<CrowdHeatmapPlaybackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(retainedWasPlaying)
  const [playbackPosition, setPlaybackPosition] = useState(retainedPlaybackPosition)
  const [sliderPosition, setSliderPosition] = useState(retainedPlaybackPosition)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(retainedPlaybackRate)
  const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined
  const amapSecurity = import.meta.env.VITE_AMAP_SECURITY as string | undefined

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const nextData = await getOverviewCrowdHeatmapData<CrowdHeatmapPlaybackData>()
        if (!active) {
          return
        }

        if (!nextData.frames.length) {
          throw new Error(`数据文件 ${DATA_PATH} 中没有可播放的时间帧`)
        }

        setPlaybackData(nextData)
        const initialPosition =
          nextData.frames.length > 0
            ? Math.min(retainedPlaybackPosition, Math.max(0, nextData.frames.length - 1))
            : 0
        setPlaybackPosition(initialPosition)
        setSliderPosition(initialPosition)
      } catch (loadError) {
        if (!active) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : '加载热力地图数据时发生未知错误'
        setError(`${message}。请确认静态文件路径和数据格式是否正确。`)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [])

  const frames = playbackData?.frames ?? EMPTY_FRAMES
  const totalFrames = frames.length
  const normalizedPlaybackPosition =
    totalFrames > 0 ? ((playbackPosition % totalFrames) + totalFrames) % totalFrames : 0
  const currentFrameIndex =
    totalFrames > 0 ? Math.min(totalFrames - 1, Math.floor(normalizedPlaybackPosition)) : 0
  const nextFrameIndex =
    totalFrames > 1 ? (currentFrameIndex + 1) % totalFrames : currentFrameIndex
  const currentFrame = frames[currentFrameIndex] ?? null
  const nextFrame = frames[nextFrameIndex] ?? currentFrame
  const isLoopBoundary = totalFrames > 1 && currentFrameIndex === totalFrames - 1
  const frameBlend =
    currentFrame && nextFrame && !isLoopBoundary ? normalizedPlaybackPosition - currentFrameIndex : 0
  const currentFramePoints = currentFrame?.points ?? EMPTY_POINTS
  const nextFramePoints = nextFrame?.points ?? currentFramePoints
  const maxSliderValue = Math.max(0, totalFrames - 1)
  const committedSliderValue = Math.min(normalizedPlaybackPosition, maxSliderValue)

  const globalMaxValue = useMemo(() => {
    const maxValue = frames.reduce((frameMax, frame) => {
      const pointMax = frame.points.reduce(
        (pointFrameMax, point) => Math.max(pointFrameMax, point[2]),
        0,
      )
      return Math.max(frameMax, pointMax)
    }, 0)

    return maxValue > 0 ? maxValue : 1
  }, [frames])

  const initialView = useMemo(
    () => (playbackData ? resolveInitialView(playbackData) : null),
    [playbackData],
  )

  const interpolatedPoints = useMemo(
    () => interpolatePoints(currentFramePoints, nextFramePoints, frameBlend),
    [currentFramePoints, frameBlend, nextFramePoints],
  )

  useEffect(() => {
    latestPointsRef.current = interpolatedPoints
  }, [interpolatedPoints])

  useEffect(() => {
    latestGlobalMaxValueRef.current = globalMaxValue
  }, [globalMaxValue])

  useEffect(() => {
    retainedPlaybackPosition = playbackPosition
  }, [playbackPosition])

  useEffect(() => {
    retainedPlaybackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    retainedWasPlaying = isPlaying
  }, [isPlaying])

  useEffect(() => {
    if (!isScrubbing) {
      setSliderPosition(committedSliderValue)
    }
  }, [committedSliderValue, isScrubbing])

  useEffect(() => {
    if (location.pathname !== '/dashboard/overview') {
      retainedWasPlaying = isPlaying
      setIsPlaying(false)
      lastTickRef.current = null
      playbackAccumulatedMsRef.current = 0
    }
  }, [isPlaying, location.pathname])

  const displayTimeLabel = useMemo(() => {
    if (!currentFrame) {
      return '--:--:--'
    }

    if (!nextFrame || isLoopBoundary) {
      return formatFrameTime(currentFrame.time)
    }

    const currentTimestamp = new Date(currentFrame.time).getTime()
    const nextTimestamp = new Date(nextFrame.time).getTime()
    const interpolatedTimestamp =
      currentTimestamp + (nextTimestamp - currentTimestamp) * frameBlend

    return formatFrameTime(new Date(interpolatedTimestamp).toISOString())
  }, [currentFrame, frameBlend, isLoopBoundary, nextFrame])

  const currentStats = useMemo(() => {
    const totalCount = interpolatedPoints.reduce((sum, point) => sum + point[2], 0)
    const peakCount = interpolatedPoints.reduce((peak, point) => Math.max(peak, point[2]), 0)

    return {
      timeLabel: displayTimeLabel,
      pointCount: interpolatedPoints.length,
      totalCount: Math.round(totalCount),
      peakCount: Math.round(peakCount),
    }
  }, [displayTimeLabel, interpolatedPoints])

  useEffect(() => {
    if (!isPlaying || totalFrames < 2) {
      lastTickRef.current = null
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return undefined
    }

    const step = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now
      }

      const delta = now - lastTickRef.current
      lastTickRef.current = now
      playbackAccumulatedMsRef.current += delta

      if (playbackAccumulatedMsRef.current >= PLAYBACK_UPDATE_INTERVAL_MS) {
        const elapsed = playbackAccumulatedMsRef.current
        playbackAccumulatedMsRef.current = 0

        setPlaybackPosition((previous) => {
          const next = previous + (elapsed * playbackRate) / BASE_FRAME_DURATION_MS
          return next >= totalFrames ? next - totalFrames : next
        })
      }

      animationFrameRef.current = window.requestAnimationFrame(step)
    }

    animationFrameRef.current = window.requestAnimationFrame(step)

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      lastTickRef.current = null
      playbackAccumulatedMsRef.current = 0
    }
  }, [isPlaying, playbackRate, totalFrames])

  useEffect(() => {
    if (!playbackData || !mapContainerRef.current || mapRef.current) {
      return undefined
    }

    if (!amapKey) {
      setError('请在 .env.local 配置 VITE_AMAP_KEY（高德 Web JS API Key）')
      return undefined
    }

    let cancelled = false
    const wrapper = mapContainerRef.current

    const initializeMap = async () => {
      try {
        const buildMap = () => {
          const AMap = window.AMap
          if (!AMap || cancelled || !wrapper || mapRef.current) {
            return
          }

          const map = new AMap.Map(wrapper, {
            viewMode: '3D',
            zoom: initialView?.zoom ?? playbackData.meta.zoom,
            center: initialView?.center ?? playbackData.meta.center,
            mapStyle: mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
            dragEnable: true,
            zoomEnable: true,
            pitchEnable: false,
          })

          map.setStatus?.({
            dragEnable: true,
            zoomEnable: true,
            doubleClickZoom: true,
            keyboardEnable: true,
            scrollWheel: true,
          })

          mapRef.current = map

          renderHeatmapRef.current = () => {
            if (!wrapper || !mapRef.current || !heatmapCanvasRef.current) {
              return
            }

            const canvas = heatmapCanvasRef.current
            const context = canvas.getContext('2d')
            if (!context) {
              return
            }

            const { width, height } = wrapper.getBoundingClientRect()
            const safeWidth = Math.max(1, Math.round(width))
            const safeHeight = Math.max(1, Math.round(height))
            const dpr = window.devicePixelRatio || 1

            if (canvas.width !== Math.round(safeWidth * dpr)) {
              canvas.width = Math.round(safeWidth * dpr)
            }
            if (canvas.height !== Math.round(safeHeight * dpr)) {
              canvas.height = Math.round(safeHeight * dpr)
            }

            canvas.style.width = `${safeWidth}px`
            canvas.style.height = `${safeHeight}px`
            context.setTransform(dpr, 0, 0, dpr, 0, 0)
            context.clearRect(0, 0, safeWidth, safeHeight)
            context.globalCompositeOperation = 'lighter'

            const points = latestPointsRef.current
            const maxValue = Math.max(1, latestGlobalMaxValueRef.current)
            const baseRadius = Math.max(14, Math.round((playbackData.meta.radius ?? 25) * 0.85))

            points.forEach(([lng, lat, count]) => {
              const pixel = mapRef.current.lngLatToContainer?.([lng, lat])
              if (!pixel) {
                return
              }

              const x = Number(pixel.x)
              const y = Number(pixel.y)
              if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return
              }

              drawHeatPoint(context, x, y, count / maxValue, baseRadius)
            })

            context.globalCompositeOperation = 'source-over'
          }

          const requestRender = () => {
            window.requestAnimationFrame(() => {
              renderHeatmapRef.current?.()
            })
          }

          window.requestAnimationFrame(() => {
            map.resize?.()
            requestRender()
          })
          setLoading(false)

          map.on?.('mapmove', requestRender)
          map.on?.('zoomchange', requestRender)
          map.on?.('moveend', requestRender)
          map.on?.('zoomend', requestRender)

          resizeObserverRef.current = new ResizeObserver(() => {
            map.resize()
            requestRender()
          })
          resizeObserverRef.current.observe(wrapper)
        }

        if (window.AMap) {
          buildMap()
          return
        }

        if (amapSecurity) {
          window._AMapSecurityConfig = {
            securityJsCode: amapSecurity,
          }
        }

        const scriptId = 'amap-sdk'
        const existing = document.getElementById(scriptId) as HTMLScriptElement | null

        if (existing) {
          const onLoad = () => buildMap()
          existing.addEventListener('load', onLoad)
          return
        }

        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`
        script.async = true
        script.onload = buildMap
        script.onerror = () => {
          if (!cancelled) {
            setError('高德地图脚本加载失败，请检查网络或 Key')
          }
        }
        document.body.appendChild(script)
      } catch (mapError) {
        if (cancelled) {
          return
        }

        const message = mapError instanceof Error ? mapError.message : '地图引擎初始化失败'
        setError(message)
      }
    }

    void initializeMap()

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      renderHeatmapRef.current = null
      if (mapRef.current) {
        mapRef.current.destroy?.()
        mapRef.current = null
      }
    }
  }, [amapKey, amapSecurity, globalMaxValue, initialView, mode, playbackData])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    if (isPlaying && !isScrubbing) {
      const now = window.performance.now()
      if (now - lastMapUpdateRef.current < MAP_UPDATE_INTERVAL_MS) {
        return
      }
      lastMapUpdateRef.current = now
    }

    renderHeatmapRef.current?.()
  }, [globalMaxValue, interpolatedPoints, isPlaying, isScrubbing])

  const handleResetView = () => {
    if (!mapRef.current || !playbackData || !initialView) {
      return
    }

    mapRef.current.setZoomAndCenter(initialView.zoom, initialView.center)
  }

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    mapRef.current.setMapStyle(
      mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
    )
  }, [mode])

  useEffect(() => {
    if (!mapRef.current || !initialView) {
      return
    }

    mapRef.current.setZoomAndCenter(initialView.zoom, initialView.center)
  }, [initialView])

  return (
    <div className={`crowd-map-panel crowd-map-panel--${mode}`}>
      <div className="crowd-map-toolbar">
        <div className="crowd-map-summary">
          <div>
            <div className="crowd-map-toolbar-label">当前时间</div>
            <div className="crowd-map-toolbar-value">{currentStats.timeLabel}</div>
          </div>
          <div>
            <div className="crowd-map-toolbar-label">人流总量</div>
            <div className="crowd-map-toolbar-value">{currentStats.totalCount}</div>
          </div>
          <div>
            <div className="crowd-map-toolbar-label">热力点位</div>
            <div className="crowd-map-toolbar-value">{currentStats.pointCount}</div>
          </div>
          <div>
            <div className="crowd-map-toolbar-label">峰值点位</div>
            <div className="crowd-map-toolbar-value">{currentStats.peakCount}</div>
          </div>
        </div>

        <div className="crowd-map-actions">
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => {
              setIsPlaying((playing) => !playing)
              lastTickRef.current = null
            }}
            disabled={totalFrames < 2}
          >
            {isPlaying ? '暂停' : '播放'}
          </Button>
          <Segmented
            options={PLAYBACK_RATES}
            value={playbackRate}
            onChange={(value) => {
              setPlaybackRate(Number(value))
              lastTickRef.current = null
            }}
          />
          <Button icon={<AimOutlined />} onClick={handleResetView}>
            重置视角
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setPlaybackPosition(0)
              setSliderPosition(0)
              setIsScrubbing(false)
              setIsPlaying(true)
              lastTickRef.current = null
            }}
          >
            回到开头
          </Button>
        </div>
      </div>

      <div className="crowd-map-stage">
        <div className="crowd-map-map-shell">
          <div ref={mapContainerRef} className="crowd-map-canvas" />
          <canvas ref={heatmapCanvasRef} className="crowd-map-heat-overlay" />
        </div>

        {loading ? (
          <div className="crowd-map-overlay">
            <Spin size="large" tip="正在加载地图与时序数据..." />
          </div>
        ) : null}

        {error ? (
          <div className="crowd-map-overlay">
            <Alert
              type="error"
              showIcon
              message="热力地图加载失败"
              description={error}
            />
          </div>
        ) : null}

        <div className="crowd-map-stage-badge">
          <span>{playbackData?.meta.timeStepSeconds ?? 30}s/帧</span>
          <span>{totalFrames > 0 ? `${currentFrameIndex + 1}/${totalFrames}` : '0/0'}</span>
        </div>
      </div>

      <div className="crowd-map-timeline">
        <div className="crowd-map-timeline-labels">
          <span>{frames[0] ? formatFrameTimeShort(frames[0].time) : '--:--:--'}</span>
          <span>{currentStats.timeLabel}</span>
          <span>
            {frames[totalFrames - 1]
              ? formatFrameTimeShort(frames[totalFrames - 1].time)
              : '--:--:--'}
          </span>
        </div>
        <Slider
          min={0}
          max={maxSliderValue}
          value={isScrubbing ? sliderPosition : committedSliderValue}
          step={0.01}
          onChange={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value
            setSliderPosition(nextValue)
            setIsScrubbing(true)
            setIsPlaying(false)
            lastTickRef.current = null
          }}
          onChangeComplete={(value) => {
            const nextValue = Array.isArray(value) ? value[0] : value
            setSliderPosition(nextValue)
            setPlaybackPosition(nextValue)
            setIsScrubbing(false)
            lastTickRef.current = null
          }}
          tooltip={{
            formatter: (value) => {
              if (typeof value !== 'number' || totalFrames === 0) {
                return '--:--:--'
              }

              const frameIndex = Math.min(totalFrames - 1, Math.max(0, Math.floor(value)))
              return formatFrameTime(frames[frameIndex].time)
            },
          }}
        />
      </div>
    </div>
  )
}

export default CrowdDensityHeatmap
