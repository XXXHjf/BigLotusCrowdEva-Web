/**
 * 静态数据访问层
 * 当前从 /public/data/*.json 读取，后续可无缝替换为 /api/*。
 */

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load static data: ${path}`)
  }
  return response.json() as Promise<T>
}

let overviewCrowdHeatmapDataCache: unknown | null = null
let overviewCrowdHeatmapDataPromise: Promise<unknown> | null = null

export function getOverview<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/overview.json')
}

export function getOverviewCrowdHeatmapData<T = unknown>(): Promise<T> {
  if (overviewCrowdHeatmapDataCache !== null) {
    return Promise.resolve(overviewCrowdHeatmapDataCache as T)
  }

  if (overviewCrowdHeatmapDataPromise !== null) {
    return overviewCrowdHeatmapDataPromise as Promise<T>
  }

  overviewCrowdHeatmapDataPromise = fetchJson<T>('/data/overview/crowd-heatmap-30s.json')
    .then((data) => {
      overviewCrowdHeatmapDataCache = data
      return data
    })
    .finally(() => {
      overviewCrowdHeatmapDataPromise = null
    })

  return overviewCrowdHeatmapDataPromise as Promise<T>
}

export function getNodes<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/nodes.json')
}

export function getClusters<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/clusters.json')
}

export function getRelations<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/relations.json')
}

export function getPatterns<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/patterns.json')
}

export function getTimeline<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/timeline.json')
}

export function getSceneById<T = unknown>(sceneId: string): Promise<T> {
  return fetchJson<T>(`/data/scenes/${sceneId}.json`)
}

export function getPatternNodes<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/pattern-analysis/nodes.json')
}

export function getPatternEdges<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/pattern-analysis/edges.json')
}

export function getPatternModeMembership<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/pattern-analysis/mode-membership.json')
}

export function getPatternModeGraphs<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/pattern-analysis/mode-graphs.json')
}

export function getTrendComparisonData<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/prediction/trend-comparison.json')
}

export function getAugmentationMainResultsData<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/prediction/augmentation-main-results.json')
}

export function getSimulationNodeNetwork<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/simulation/node-network.json')
}

export function getSimulationCounterfactualResults<T = unknown>(): Promise<T> {
  return fetchJson<T>('/data/simulation/counterfactual-results.json')
}
