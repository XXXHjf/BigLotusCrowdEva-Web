interface HeatmapFeatureProperties {
  count: number
  weight: number
}

interface HeatmapFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: HeatmapFeatureProperties
}

interface HeatmapFeatureCollection {
  type: 'FeatureCollection'
  features: HeatmapFeature[]
}

interface MapLibreGeoJsonSource {
  setData(data: HeatmapFeatureCollection): void
}

interface MapLibreMap {
  addControl(
    control: unknown,
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  ): void
  once(event: 'load', listener: () => void): void
  getSource(id: string): MapLibreGeoJsonSource | undefined
  addSource(
    id: string,
    source: {
      type: 'geojson'
      data: HeatmapFeatureCollection
    },
  ): void
  getLayer(id: string): unknown
  addLayer(layer: Record<string, unknown>): void
  remove(): void
  resize(): void
  isStyleLoaded(): boolean
  flyTo(options: {
    center: [number, number]
    zoom: number
    essential: boolean
  }): void
}

interface MapLibreGlobal {
  Map: new (options: {
    container: HTMLElement
    style: string
    center: [number, number]
    zoom: number
    attributionControl: boolean
  }) => MapLibreMap
  NavigationControl: new (options: { showCompass: boolean }) => unknown
}

declare global {
  interface Window {
    maplibregl?: MapLibreGlobal
  }
}

export type { HeatmapFeatureCollection, MapLibreGlobal, MapLibreMap }
