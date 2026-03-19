import type { MapLibreGlobal } from '../types/maplibre'

const MAPLIBRE_SCRIPT_SRC = '/maplibre/maplibre-gl.js'

let mapLibrePromise: Promise<MapLibreGlobal> | null = null

export const loadMapLibre = async () => {
  if (window.maplibregl) {
    return window.maplibregl
  }

  if (!mapLibrePromise) {
    mapLibrePromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${MAPLIBRE_SCRIPT_SRC}"]`,
      )

      const handleLoad = () => {
        if (window.maplibregl) {
          resolve(window.maplibregl)
          return
        }

        reject(new Error('MapLibre 脚本加载完成，但全局对象未找到'))
      }

      const handleError = () => {
        reject(new Error(`无法加载地图引擎脚本: ${MAPLIBRE_SCRIPT_SRC}`))
      }

      if (existingScript) {
        existingScript.addEventListener('load', handleLoad, { once: true })
        existingScript.addEventListener('error', handleError, { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = MAPLIBRE_SCRIPT_SRC
      script.async = true
      script.addEventListener('load', handleLoad, { once: true })
      script.addEventListener('error', handleError, { once: true })
      document.head.appendChild(script)
    })
  }

  return mapLibrePromise
}
