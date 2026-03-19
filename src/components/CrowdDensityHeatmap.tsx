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
import type { HeatmapFeatureCollection, MapLibreMap } from '../types/maplibre'
import { loadMapLibre } from '../utils/loadMapLibre'

const DATA_PATH = '/data/overview/crowd-heatmap-30s.json'
const HEATMAP_SOURCE_ID = 'crowd-heatmap-source'
const HEATMAP_LAYER_ID = 'crowd-heatmap-layer'
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
const MIN_VISIBLE_WEIGHT = 0.5
let retainedMapHost: HTMLDivElement | null = null
let retainedMapInstance: MapLibreMap | null = null
let retainedMapParkingContainer: HTMLDivElement | null = null
let retainedPlaybackPosition = 0
let retainedPlaybackRate = 1
let retainedWasPlaying = true

const ensureRetainedMapParkingContainer = () => {
  if (retainedMapParkingContainer) {
    return retainedMapParkingContainer
  }

  const parkingContainer = document.createElement('div')
  parkingContainer.style.position = 'fixed'
  parkingContainer.style.left = '-99999px'
  parkingContainer.style.top = '0'
  parkingContainer.style.width = '1px'
  parkingContainer.style.height = '1px'
  parkingContainer.style.opacity = '0'
  parkingContainer.style.pointerEvents = 'none'
  parkingContainer.style.overflow = 'hidden'
  document.body.appendChild(parkingContainer)
  retainedMapParkingContainer = parkingContainer
  return parkingContainer
}

const ensureRetainedMapHost = () => {
  if (retainedMapHost) {
    return retainedMapHost
  }

  const host = document.createElement('div')
  host.style.width = '100%'
  host.style.height = '100%'
  retainedMapHost = host
  return host
}

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

const buildFeatureCollection = (
  points: CrowdHeatmapPoint[],
  globalMaxValue: number,
): HeatmapFeatureCollection => ({
  type: 'FeatureCollection',
  features: points.map(([lng, lat, count]) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    properties: {
      count,
      weight: Math.max(0.05, count / globalMaxValue),
    },
  })),
})

const interpolatePoints = (
  fromPoints: CrowdHeatmapPoint[],
  toPoints: CrowdHeatmapPoint[],
  blend: number,
) => {
  const pointMap = new Map<string, { lng: number; lat: number; from: number; to: number }>()

  fromPoints.forEach(([lng, lat, value]) => {
    pointMap.set(`${lng.toFixed(6)},${lat.toFixed(6)}`, {
      lng,
      lat,
      from: value,
      to: 0,
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
      from: 0,
      to: value,
    })
  })

  return Array.from(pointMap.values())
    .map(({ lng, lat, from, to }) => {
      const value = from + (to - from) * blend
      return [lng, lat, Number(value.toFixed(2))] as CrowdHeatmapPoint
    })
    .filter((point) => point[2] >= MIN_VISIBLE_WEIGHT)
}

const CrowdDensityHeatmap = () => {
  const { mode } = useThemeMode()
  const location = useLocation()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTickRef = useRef<number | null>(null)
  const playbackAccumulatedMsRef = useRef(0)
  const lastMapUpdateRef = useRef(0)
  const latestPointsRef = useRef<CrowdHeatmapPoint[]>(EMPTY_POINTS)
  const [playbackData, setPlaybackData] = useState<CrowdHeatmapPlaybackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(retainedWasPlaying)
  const [playbackPosition, setPlaybackPosition] = useState(retainedPlaybackPosition)
  const [sliderPosition, setSliderPosition] = useState(retainedPlaybackPosition)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(retainedPlaybackRate)

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

  const interpolatedPoints = useMemo(
    () => interpolatePoints(currentFramePoints, nextFramePoints, frameBlend),
    [currentFramePoints, frameBlend, nextFramePoints],
  )

  useEffect(() => {
    latestPointsRef.current = interpolatedPoints
  }, [interpolatedPoints])

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

    let cancelled = false

    const wrapper = mapContainerRef.current
    const mapHost = ensureRetainedMapHost()
    if (mapHost.parentElement !== wrapper) {
      wrapper.replaceChildren(mapHost)
    }

    if (retainedMapInstance) {
      mapRef.current = retainedMapInstance
      setLoading(false)
      window.requestAnimationFrame(() => {
        retainedMapInstance?.resize()
      })

      resizeObserverRef.current = new ResizeObserver(() => {
        retainedMapInstance?.resize()
      })
      resizeObserverRef.current.observe(wrapper)

      return () => {
        resizeObserverRef.current?.disconnect()
        resizeObserverRef.current = null
        const parkingContainer = ensureRetainedMapParkingContainer()
        if (mapHost.parentElement !== parkingContainer) {
          parkingContainer.replaceChildren(mapHost)
        }
      }
    }

    const initializeMap = async () => {
      try {
        const maplibre = await loadMapLibre()
        if (cancelled || !wrapper) {
          return
        }

        const map = new maplibre.Map({
          container: mapHost,
          style: '/map-style.json',
          center: playbackData.meta.center,
          zoom: playbackData.meta.zoom,
          attributionControl: true,
        })

        mapRef.current = map
        retainedMapInstance = map
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')

        map.once('load', () => {
          if (!map.getSource(HEATMAP_SOURCE_ID)) {
            map.addSource(HEATMAP_SOURCE_ID, {
              type: 'geojson',
              data: buildFeatureCollection(latestPointsRef.current, globalMaxValue),
            })
          }

          if (!map.getLayer(HEATMAP_LAYER_ID)) {
            map.addLayer({
              id: HEATMAP_LAYER_ID,
              type: 'heatmap',
              source: HEATMAP_SOURCE_ID,
              maxzoom: 18,
              paint: {
                'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
                'heatmap-intensity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9,
                  playbackData.meta.intensity ?? 1.05,
                  13,
                  (playbackData.meta.intensity ?? 1.05) * 1.18,
                  16,
                  (playbackData.meta.intensity ?? 1.05) * 1.32,
                  18,
                  (playbackData.meta.intensity ?? 1.05) * 1.45,
                ],
                'heatmap-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9,
                  Math.max(14, Math.round((playbackData.meta.radius ?? 30) * 0.55)),
                  12,
                  Math.round((playbackData.meta.radius ?? 30) * 0.95),
                  15,
                  Math.round((playbackData.meta.radius ?? 30) * 1.35),
                  18,
                  Math.round((playbackData.meta.radius ?? 30) * 1.9),
                ],
                'heatmap-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9,
                  0.88,
                  14,
                  0.92,
                  18,
                  0.96,
                ],
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(15, 28, 61, 0)',
                  0.2,
                  '#135d8f',
                  0.45,
                  '#1db2d6',
                  0.7,
                  '#7cf0ff',
                  0.9,
                  '#ffd166',
                  1,
                  '#ff7f50',
                ],
              },
            })
          }
        })

        resizeObserverRef.current = new ResizeObserver(() => {
          map.resize()
        })
        resizeObserverRef.current.observe(wrapper)
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

      if (retainedMapHost) {
        const parkingContainer = ensureRetainedMapParkingContainer()
        if (retainedMapHost.parentElement !== parkingContainer) {
          parkingContainer.replaceChildren(retainedMapHost)
        }
      }
      mapRef.current = retainedMapInstance
    }
  }, [globalMaxValue, playbackData])

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
      return
    }

    if (isPlaying && !isScrubbing) {
      const now = window.performance.now()
      if (now - lastMapUpdateRef.current < MAP_UPDATE_INTERVAL_MS) {
        return
      }
      lastMapUpdateRef.current = now
    }

    const source = mapRef.current.getSource(HEATMAP_SOURCE_ID)
    if (source?.setData) {
      source.setData(buildFeatureCollection(interpolatedPoints, globalMaxValue))
    }
  }, [globalMaxValue, interpolatedPoints, isPlaying, isScrubbing])

  const handleResetView = () => {
    if (!mapRef.current || !playbackData) {
      return
    }

    mapRef.current.flyTo({
      center: playbackData.meta.center,
      zoom: playbackData.meta.zoom,
      essential: true,
    })
  }

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
        <div ref={mapContainerRef} className="crowd-map-canvas" />

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
