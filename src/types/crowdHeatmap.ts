export type CrowdHeatmapPoint = [lng: number, lat: number, value: number]

export interface CrowdHeatmapFrame {
  time: string
  points: CrowdHeatmapPoint[]
}

export interface CrowdHeatmapMeta {
  center: [lng: number, lat: number]
  zoom: number
  radius?: number
  intensity?: number
  timeStepSeconds: number
  dataLabel?: string
}

export interface CrowdHeatmapPlaybackData {
  meta: CrowdHeatmapMeta
  frames: CrowdHeatmapFrame[]
}
