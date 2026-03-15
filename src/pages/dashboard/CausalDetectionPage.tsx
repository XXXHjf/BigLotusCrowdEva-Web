// src/pages/dashboard/CausalDetectionPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Col, Empty, Row, Typography, Segmented, Space, Tag, Divider } from 'antd'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import type { EChartsOption, GraphSeriesOption } from 'echarts'
import './CausalDetectionPage.css'
import { useThemeMode } from '../../context/ThemeContext'

// 运行时从 CDN 注入 maplibre-gl，供 ECharts mapbox 坐标系使用
declare global {
  interface Window {
    mapboxgl?: unknown
    maplibregl?: unknown
  }
}

type MajorNodeId = 'major-a' | 'major-b' | 'major-c' | 'major-d'

interface MajorNode {
  id: MajorNodeId
  label: string
  lng: number
  lat: number
}

interface MajorEdge {
  source: MajorNodeId
  target: MajorNodeId
  value: number
}

interface HexCell {
  id: string
  label: string
  lng: number
  lat: number
  majorNodeId: MajorNodeId
  volume: number
}

type ModeType = 'causalChain' | 'hubNode' | 'community' | 'keyNode'

const { Text } = Typography

// 拟真演出时段，晚高峰入场/离场窗口
const timeSlots = ['18:00-18:10', '18:10-18:20', '18:20-18:35', '18:35-18:50']

// 主要结点（带经纬度，用于线条/高光）
const majorNodes: MajorNode[] = [
  { id: 'major-a', label: '东入口枢纽', lng: 120.1763, lat: 30.2759 },
  { id: 'major-b', label: '北看台集散', lng: 120.1606, lat: 30.2921 },
  { id: 'major-c', label: '中央大厅', lng: 120.1528, lat: 30.2724 },
  { id: 'major-d', label: '南出口集散', lng: 120.1522, lat: 30.2572 },
]

const majorNodeColor: Record<MajorNodeId, string> = {
  'major-a': '#4cc3ff',
  'major-b': '#7e57c2',
  'major-c': '#5ad8a6',
  'major-d': '#ffa940',
}

const majorEdgesByTime: Record<string, MajorEdge[]> = {
  '18:00-18:10': [
    { source: 'major-a', target: 'major-b', value: 180 },
    { source: 'major-b', target: 'major-c', value: 120 },
    { source: 'major-c', target: 'major-d', value: 65 },
    { source: 'major-a', target: 'major-c', value: 70 },
    { source: 'major-b', target: 'major-d', value: 40 },
  ],
  '18:10-18:20': [
    { source: 'major-a', target: 'major-b', value: 160 },
    { source: 'major-b', target: 'major-c', value: 140 },
    { source: 'major-c', target: 'major-d', value: 90 },
    { source: 'major-b', target: 'major-d', value: 58 },
  ],
  '18:20-18:35': [
    { source: 'major-a', target: 'major-c', value: 130 },
    { source: 'major-b', target: 'major-c', value: 115 },
    { source: 'major-c', target: 'major-d', value: 100 },
    { source: 'major-b', target: 'major-d', value: 72 },
  ],
  '18:35-18:50': [
    { source: 'major-a', target: 'major-b', value: 80 },
    { source: 'major-b', target: 'major-d', value: 95 },
    { source: 'major-c', target: 'major-d', value: 120 },
  ],
}

// 原始点位，已添加经纬度（取西湖文化广场附近一圈，方便展示）
const hexCells: HexCell[] = [
  { id: 'raw-1', label: '东门A通道', lng: 120.1781, lat: 30.2762, majorNodeId: 'major-a', volume: 320 },
  { id: 'raw-2', label: '东门B通道', lng: 120.1889, lat: 30.2683, majorNodeId: 'major-a', volume: 280 },
  { id: 'raw-3', label: '东侧检票口', lng: 120.2012, lat: 30.2574, majorNodeId: 'major-a', volume: 190 },
  { id: 'raw-4', label: '北看台1区', lng: 120.1586, lat: 30.3124, majorNodeId: 'major-b', volume: 260 },
  { id: 'raw-5', label: '北看台2区', lng: 120.1633, lat: 30.2985, majorNodeId: 'major-b', volume: 235 },
  { id: 'raw-6', label: '北看台3区', lng: 120.1497, lat: 30.3031, majorNodeId: 'major-b', volume: 210 },
  { id: 'raw-7', label: '大厅东侧', lng: 120.1429, lat: 30.2791, majorNodeId: 'major-c', volume: 340 },
  { id: 'raw-8', label: '大厅西侧', lng: 120.1292, lat: 30.2720, majorNodeId: 'major-c', volume: 305 },
  { id: 'raw-9', label: '中央补给点', lng: 120.1520, lat: 30.2689, majorNodeId: 'major-c', volume: 220 },
  { id: 'raw-10', label: '南出口走廊', lng: 120.1467, lat: 30.2444, majorNodeId: 'major-d', volume: 260 },
  { id: 'raw-11', label: '南门检票区', lng: 120.1689, lat: 30.2383, majorNodeId: 'major-d', volume: 280 },
  { id: 'raw-12', label: '南门候梯区', lng: 120.1320, lat: 30.2339, majorNodeId: 'major-d', volume: 230 },
  { id: 'raw-13', label: '应急集结点', lng: 120.1106, lat: 30.2617, majorNodeId: 'major-a', volume: 160 },
  { id: 'raw-14', label: '临时疏导口', lng: 120.1211, lat: 30.2878, majorNodeId: 'major-b', volume: 175 },
  { id: 'raw-15', label: '核心补给仓', lng: 120.0957, lat: 30.2744, majorNodeId: 'major-c', volume: 145 },
  { id: 'raw-16', label: '环路联控点', lng: 120.2120, lat: 30.2920, majorNodeId: 'major-a', volume: 165 },
  { id: 'raw-17', label: '滨江换乘', lng: 120.2022, lat: 30.2280, majorNodeId: 'major-d', volume: 205 },
  { id: 'raw-18', label: '西山步道', lng: 120.0700, lat: 30.2810, majorNodeId: 'major-c', volume: 155 },
]

// 模式子图示例数据（真实接入时按后端返回替换）
const modeGraphs: Record<MajorNodeId, Record<ModeType, GraphSeriesOption>> = {
  'major-a': {
    causalChain: {
      type: 'graph',
      layout: 'none',
      symbolSize: 36,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '入口-时序1', x: 10, y: 60 },
        { name: '入口-时序2', x: 80, y: 60 },
        { name: '入口-时序3', x: 150, y: 60 },
      ],
      links: [
        { source: '入口-时序1', target: '入口-时序2' },
        { source: '入口-时序2', target: '入口-时序3' },
      ],
    },
    hubNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 28,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '枢纽H', x: 100, y: 70 },
        { name: '看台A', x: 30, y: 30 },
        { name: '看台B', x: 170, y: 30 },
        { name: '走廊C', x: 30, y: 120 },
        { name: '走廊D', x: 170, y: 120 },
      ],
      links: [
        { source: '枢纽H', target: '看台A' },
        { source: '枢纽H', target: '看台B' },
        { source: '枢纽H', target: '走廊C' },
        { source: '枢纽H', target: '走廊D' },
      ],
    },
    community: {
      type: 'graph',
      layout: 'none',
      symbolSize: 22,
      data: [
        { name: '社区1', x: 40, y: 50 },
        { name: '社区2', x: 90, y: 30 },
        { name: '社区3', x: 140, y: 50 },
        { name: '社区4', x: 70, y: 100 },
        { name: '社区5', x: 120, y: 100 },
      ],
      links: [
        { source: '社区1', target: '社区2' },
        { source: '社区2', target: '社区3' },
        { source: '社区3', target: '社区5' },
        { source: '社区1', target: '社区4' },
        { source: '社区4', target: '社区5' },
      ],
    },
    keyNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 26,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '关键K', x: 100, y: 80 },
        { name: '连通1', x: 40, y: 40 },
        { name: '连通2', x: 160, y: 40 },
        { name: '连通3', x: 40, y: 140 },
        { name: '连通4', x: 160, y: 140 },
      ],
      links: [
        { source: '关键K', target: '连通1' },
        { source: '关键K', target: '连通2' },
        { source: '关键K', target: '连通3' },
        { source: '关键K', target: '连通4' },
      ],
    },
  },
  'major-b': {
    causalChain: {
      type: 'graph',
      layout: 'none',
      symbolSize: 36,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '看台-时序1', x: 10, y: 60 },
        { name: '看台-时序2', x: 80, y: 60 },
        { name: '看台-时序3', x: 150, y: 60 },
      ],
      links: [
        { source: '看台-时序1', target: '看台-时序2' },
        { source: '看台-时序2', target: '看台-时序3' },
      ],
    },
    hubNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 28,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '枢纽H', x: 100, y: 70 },
        { name: '北梯A', x: 40, y: 30 },
        { name: '北梯B', x: 160, y: 30 },
        { name: '北梯C', x: 40, y: 120 },
        { name: '北梯D', x: 160, y: 120 },
        { name: '看台补给', x: 100, y: 130 },
      ],
      links: [
        { source: '枢纽H', target: '北梯A' },
        { source: '枢纽H', target: '北梯B' },
        { source: '枢纽H', target: '北梯C' },
        { source: '枢纽H', target: '北梯D' },
        { source: '枢纽H', target: '看台补给' },
      ],
    },
    community: {
      type: 'graph',
      layout: 'none',
      symbolSize: 22,
      data: [
        { name: '看台社区1', x: 50, y: 40 },
        { name: '看台社区2', x: 100, y: 20 },
        { name: '看台社区3', x: 150, y: 40 },
        { name: '看台社区4', x: 70, y: 110 },
        { name: '看台社区5', x: 130, y: 110 },
      ],
      links: [
        { source: '看台社区1', target: '看台社区2' },
        { source: '看台社区2', target: '看台社区3' },
        { source: '看台社区3', target: '看台社区5' },
        { source: '看台社区1', target: '看台社区4' },
        { source: '看台社区4', target: '看台社区5' },
      ],
    },
    keyNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 26,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '关键K', x: 100, y: 80 },
        { name: '通道1', x: 40, y: 40 },
        { name: '通道2', x: 160, y: 40 },
        { name: '应急1', x: 40, y: 140 },
        { name: '应急2', x: 160, y: 140 },
      ],
      links: [
        { source: '关键K', target: '通道1' },
        { source: '通道1', target: '通道2' },
        { source: '关键K', target: '应急1' },
        { source: '应急1', target: '应急2' },
      ],
    },
  },
  'major-c': {
    causalChain: {
      type: 'graph',
      layout: 'none',
      symbolSize: 36,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '大厅-时序1', x: 10, y: 60 },
        { name: '大厅-时序2', x: 80, y: 60 },
        { name: '大厅-时序3', x: 150, y: 60 },
      ],
      links: [
        { source: '大厅-时序1', target: '大厅-时序2' },
        { source: '大厅-时序2', target: '大厅-时序3' },
      ],
    },
    hubNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 28,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '枢纽H', x: 100, y: 70 },
        { name: '扶梯A', x: 50, y: 20 },
        { name: '扶梯B', x: 150, y: 20 },
        { name: '检票C', x: 30, y: 120 },
        { name: '检票D', x: 170, y: 120 },
      ],
      links: [
        { source: '枢纽H', target: '扶梯A' },
        { source: '枢纽H', target: '扶梯B' },
        { source: '枢纽H', target: '检票C' },
        { source: '枢纽H', target: '检票D' },
      ],
    },
    community: {
      type: 'graph',
      layout: 'none',
      symbolSize: 22,
      data: [
        { name: '大厅区1', x: 40, y: 60 },
        { name: '大厅区2', x: 100, y: 30 },
        { name: '大厅区3', x: 160, y: 60 },
        { name: '大厅区4', x: 70, y: 110 },
        { name: '大厅区5', x: 130, y: 110 },
      ],
      links: [
        { source: '大厅区1', target: '大厅区2' },
        { source: '大厅区2', target: '大厅区3' },
        { source: '大厅区1', target: '大厅区4' },
        { source: '大厅区3', target: '大厅区5' },
        { source: '大厅区4', target: '大厅区5' },
      ],
    },
    keyNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 26,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '关键K', x: 100, y: 80 },
        { name: '连接1', x: 40, y: 40 },
        { name: '连接2', x: 160, y: 40 },
        { name: '连接3', x: 40, y: 140 },
        { name: '连接4', x: 160, y: 140 },
      ],
      links: [
        { source: '关键K', target: '连接1' },
        { source: '连接2', target: '关键K' },
        { source: '关键K', target: '连接3' },
        { source: '连接3', target: '连接4' },
      ],
    },
  },
  'major-d': {
    causalChain: {
      type: 'graph',
      layout: 'none',
      symbolSize: 36,
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '出口-时序1', x: 10, y: 60 },
        { name: '出口-时序2', x: 80, y: 60 },
        { name: '出口-时序3', x: 150, y: 60 },
      ],
      links: [
        { source: '出口-时序1', target: '出口-时序2' },
        { source: '出口-时序2', target: '出口-时序3' },
      ],
    },
    hubNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 28,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '枢纽H', x: 100, y: 70 },
        { name: '疏散1', x: 40, y: 30 },
        { name: '疏散2', x: 160, y: 30 },
        { name: '疏散3', x: 40, y: 120 },
        { name: '疏散4', x: 160, y: 120 },
        { name: '服务点', x: 100, y: 130 },
      ],
      links: [
        { source: '疏散1', target: '枢纽H' },
        { source: '疏散2', target: '枢纽H' },
        { source: '疏散3', target: '枢纽H' },
        { source: '疏散4', target: '枢纽H' },
        { source: '服务点', target: '枢纽H' },
      ],
    },
    community: {
      type: 'graph',
      layout: 'none',
      symbolSize: 22,
      data: [
        { name: '出口区1', x: 50, y: 50 },
        { name: '出口区2', x: 120, y: 40 },
        { name: '出口区3', x: 160, y: 80 },
        { name: '出口区4', x: 90, y: 110 },
      ],
      links: [
        { source: '出口区1', target: '出口区2' },
        { source: '出口区2', target: '出口区3' },
        { source: '出口区3', target: '出口区4' },
        { source: '出口区4', target: '出口区1' },
      ],
    },
    keyNode: {
      type: 'graph',
      layout: 'none',
      symbolSize: 26,
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: 10,
      data: [
        { name: '关键K', x: 100, y: 80 },
        { name: '出口N1', x: 40, y: 40 },
        { name: '出口N2', x: 160, y: 40 },
        { name: '出口N3', x: 40, y: 140 },
        { name: '出口N4', x: 160, y: 140 },
      ],
      links: [
        { source: '出口N1', target: '关键K' },
        { source: '关键K', target: '出口N2' },
        { source: '关键K', target: '出口N3' },
        { source: '出口N3', target: '出口N4' },
      ],
    },
  },
}

const buildModeOption = (
  modeTitle: string,
  series: GraphSeriesOption | undefined,
  textColor: string,
): EChartsOption => {
  const baseSeries: GraphSeriesOption =
    series ||
    ({
      type: 'graph',
      data: [],
      links: [],
    } as GraphSeriesOption)

  return {
    backgroundColor: 'transparent',
    title: {
      text: modeTitle,
      left: 'center',
      top: 6,
      textStyle: { color: textColor, fontSize: 13, fontWeight: 600 },
    },
    tooltip: { show: false },
    series: [
      {
        ...baseSeries,
        lineStyle: {
          color: '#4cc3ff',
          width: 2,
          opacity: 0.85,
        },
        itemStyle: {
          color: '#7e57c2',
          borderColor: '#4cc3ff',
        },
        label: {
          show: true,
          color: textColor,
          fontSize: 12,
        },
      },
    ],
    grid: { containLabel: true },
  }
}

const CausalDetectionPage = () => {
  const { mode } = useThemeMode()
  const [selectedMajorNodeId, setSelectedMajorNodeId] = useState<MajorNodeId | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(timeSlots[0])
  const [mapReady, setMapReady] = useState<boolean>(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Array<{ marker: any; majorId: MajorNodeId }>>([])
  const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined
  const amapSecurity = import.meta.env.VITE_AMAP_SECURITY as string | undefined

  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const mutedColor = mode === 'dark' ? '#9fb3d9' : '#4a5a73'
  const panelBg = mode === 'dark' ? 'rgba(76, 195, 255, 0.12)' : '#e6f4ff'
  const borderColor = mode === 'dark' ? '#1f2d4d' : '#dce4f2'

  // 加载高德地图 JSAPI 并绘制动效标记
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!amapKey) {
      setMapError('请在 .env.local 配置 VITE_AMAP_KEY（高德 Web JS API Key）')
      return
    }

    const buildMap = () => {
      const AMap = (window as any).AMap
      if (!AMap || mapInstanceRef.current) return

      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '3D',
        zoom: 12.5,
        center: [120.16, 30.27],
        mapStyle: mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
        dragEnable: true,
        zoomEnable: true,
        pitch: 35,
      })
      mapInstanceRef.current = map

      // 清空旧标记
      markersRef.current.forEach(({ marker }) => marker.setMap(null))
      markersRef.current = []

      hexCells.forEach((cell) => {
        const color = majorNodeColor[cell.majorNodeId]
        const marker = new AMap.Marker({
          position: [cell.lng, cell.lat],
          offset: new AMap.Pixel(-12, -12),
          anchor: 'center',
          title: cell.label,
          content: `<div class="pulse-marker" data-major="${cell.majorNodeId}" style="--pulse-color:${color}"><div class="pulse-dot"></div><div class="pulse-ring"></div><div class="pulse-label">${cell.label}</div></div>`,
        })
        marker.on('click', () => setSelectedMajorNodeId(cell.majorNodeId))
        marker.setMap(map)
        markersRef.current.push({ marker, majorId: cell.majorNodeId })
      })

      setMapReady(true)
    }

    // 如果 SDK 已经存在，直接建图
    if ((window as any).AMap) {
      buildMap()
      return
    }

    if (amapSecurity) {
      ;(window as any)._AMapSecurityConfig = { securityJsCode: amapSecurity }
    }

    const scriptId = 'amap-sdk'
    const existing = document.getElementById(scriptId)
    if (existing) {
      // 说明脚本正在或已加载，等待稍后构建地图
      const onLoad = () => buildMap()
      existing.addEventListener('load', onLoad)
      return () => existing.removeEventListener('load', onLoad)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`
    script.async = true
    script.onload = buildMap
    script.onerror = () => setMapError('高德地图脚本加载失败，请检查网络或 Key')
    document.body.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
      markersRef.current.forEach(({ marker }) => marker.setMap(null))
      markersRef.current = []
    }
  }, [amapKey, amapSecurity, mapError, mode])

  // 选中结点时同步高德标记的明暗
  useEffect(() => {
    markersRef.current.forEach(({ marker, majorId }) => {
      const active = !selectedMajorNodeId || majorId === selectedMajorNodeId
      if (active) {
        marker.show?.()
      } else {
        marker.hide?.()
      }
    })
  }, [selectedMajorNodeId])

  // 主题变化时切换高德内置样式
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapStyle(
        mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
      )
    }
  }, [mode])

  const edgeSet = useMemo(
    () => majorEdgesByTime[selectedTimeSlot] || majorEdgesByTime[timeSlots[0]],
    [selectedTimeSlot],
  )

  const selectedNode = selectedMajorNodeId
    ? majorNodes.find((node) => node.id === selectedMajorNodeId)
    : null

  const selectedFlow = useMemo(() => {
    if (!selectedMajorNodeId) return null
    const relatedEdges = edgeSet.filter(
      (edge) => edge.source === selectedMajorNodeId || edge.target === selectedMajorNodeId,
    )
    const total = relatedEdges.reduce((sum, edge) => sum + edge.value, 0)
    return { total, count: relatedEdges.length }
  }, [edgeSet, selectedMajorNodeId])

  const directedGraphOption: EChartsOption = useMemo(() => {
    // 预设圆形布局，保持节点位置稳定
    const radius = 160
    const centerX = 0
    const centerY = 0

    const nodes = majorNodes.map((node, idx) => {
      const angle = (Math.PI * 2 * idx) / majorNodes.length
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      return {
        id: node.id,
        name: node.label,
        value: selectedTimeSlot,
        symbolSize: 48,
        itemStyle: {
          color: node.id === selectedMajorNodeId ? '#4cc3ff' : majorNodeColor[node.id],
          shadowColor: node.id === selectedMajorNodeId ? '#4cc3ff' : 'transparent',
          shadowBlur: node.id === selectedMajorNodeId ? 16 : 0,
        },
        label: {
          color: textColor,
          formatter: '{b}',
        },
        x,
        y,
      }
    })

    const links = edgeSet.map((edge) => {
      const isActive =
        selectedMajorNodeId !== null &&
        (edge.source === selectedMajorNodeId || edge.target === selectedMajorNodeId)
      return {
        source: edge.source,
        target: edge.target,
        value: edge.value,
        lineStyle: {
          color: isActive ? '#4cc3ff' : mutedColor,
          width: isActive ? 3 : 2,
          opacity: isActive ? 0.95 : 0.45,
        },
        emphasis: {
          lineStyle: { width: 4 },
        },
      }
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const node = majorNodes.find((n) => n.id === params.data.id)
            return node?.label || ''
          }
          if (params.dataType === 'edge') {
            return `流向：${params.data.source} → ${params.data.target}<br/>流量：${params.data.value}`
          }
          return ''
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: 12,
          label: { show: true, color: textColor },
          data: nodes,
          links,
          lineStyle: { curveness: 0.2 },
          emphasis: { focus: 'adjacency' },
        },
      ],
    }
  }, [edgeSet, mutedColor, selectedMajorNodeId, selectedTimeSlot, textColor])

  const handleNodeSelect = (nodeId: MajorNodeId) => {
    setSelectedMajorNodeId(nodeId)
  }

  const onGraphEvents = {
    click: (params: any) => {
      if (params.dataType === 'node' && params.data?.id) {
        handleNodeSelect(params.data.id as MajorNodeId)
      }
    },
  }

  const renderModePanel = (modeKey: ModeType, title: string) => {
    if (!selectedMajorNodeId) {
      return (
        <div className="mode-card-empty">
          <Empty description="点击中间主要结点以加载模式子图" />
        </div>
      )
    }

    const series = modeGraphs[selectedMajorNodeId]?.[modeKey]
    const option = buildModeOption(title, series, textColor)

    return (
      <ReactECharts option={option} style={{ width: '100%', height: '220px' }} />
    )
  }

  return (
    <div className="page-shell">
      <div className="time-control">
        <Space size="middle">
          <Text type="secondary">时间窗口</Text>
          <Segmented
            options={timeSlots}
            value={selectedTimeSlot}
            onChange={(val) => setSelectedTimeSlot(val as string)}
            size="middle"
          />
          {selectedNode && selectedFlow && (
            <Tag color="blue">
              {selectedNode.label} · {selectedTimeSlot} · 总流量 {selectedFlow.total}
              {selectedFlow.count ? ` / 边 ${selectedFlow.count}` : ''}
            </Tag>
          )}
          <Text type="secondary">点击节点联动时间片结果</Text>
        </Space>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
          <Card
            title="原始地图（经纬度六边形）"
            className="panel-card"
            bordered={false}
            bodyStyle={{ height: '520px', padding: 4, overflow: 'hidden' }}
          >
            <div className="map-legend">
              <div className="legend-dot" style={{ background: majorNodeColor['major-a'] }} /> 入场初始点
              <div className="legend-dot" style={{ background: majorNodeColor['major-b'] }} /> 看台初始点
              <div className="legend-dot" style={{ background: majorNodeColor['major-c'] }} /> 中央初始点
              <div className="legend-dot" style={{ background: majorNodeColor['major-d'] }} /> 出口初始点
            </div>
            {mapError && (
              <div className="map-error">{mapError}</div>
            )}
            <div
              ref={mapContainerRef}
              className="amap-container"
              aria-label="amap-container"
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title="时空图数据"
            className="panel-card"
            bordered={false}
            bodyStyle={{ height: '520px', padding: 0 }}
          >
            <ReactECharts
              option={directedGraphOption}
              style={{ width: '100%', height: '100%' }}
              onEvents={onGraphEvents}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="模式子图"
            className="panel-card"
            bordered={false}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('causalChain', '因果链')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('hubNode', '枢纽节点')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('community', '社区结构')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('keyNode', '关键节点')}
                </Card>
              </Col>
            </Row>
            {!selectedMajorNodeId && (
              <div className="mode-help-text">
                <Text type="secondary">
                  点击地图或中间节点，联动左侧原始点位高亮与右侧四种模式子图。
                </Text>
              </div>
            )}
            {selectedMajorNodeId && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div className="mode-stat">
                  <Text type="secondary">当前主枢纽</Text>
                  <Text strong style={{ color: majorNodeColor[selectedMajorNodeId] }}>
                    {selectedNode?.label}
                  </Text>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CausalDetectionPage
