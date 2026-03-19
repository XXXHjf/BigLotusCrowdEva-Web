import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'

const DEFAULT_STEP_SECONDS = 30
const DEFAULT_ZOOM = 15
const DEFAULT_GRID_SIZE = 0.00022
const DEFAULT_INPUT_DIR = 'public/data/0829-0831'

const parseArgs = (argv) => {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) {
      continue
    }

    const key = token.slice(2)
    const nextValue = argv[index + 1]
    if (!nextValue || nextValue.startsWith('--')) {
      args[key] = 'true'
      continue
    }

    args[key] = nextValue
    index += 1
  }

  return args
}

const splitCsvLine = (line) => {
  const values = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      const nextCharacter = line[index + 1]
      if (insideQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
        continue
      }

      insideQuotes = !insideQuotes
      continue
    }

    if (character === ',' && !insideQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += character
  }

  values.push(current)
  return values.map((value) => value.trim())
}

const pickKey = (record, candidates) =>
  candidates.find((candidate) =>
    Object.keys(record).some((key) => key.toLowerCase() === candidate.toLowerCase()),
  )

const resolveRecordValue = (record, targetKey) => {
  const actualKey = Object.keys(record).find((key) => key.toLowerCase() === targetKey.toLowerCase())
  return actualKey ? record[actualKey] : undefined
}

const parseCsv = (content) => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const header = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    return header.reduce((record, key, index) => {
      record[key] = values[index] ?? ''
      return record
    }, {})
  })
}

const parseTimestamp = (value) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return Number.NaN
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(' ', 'T')).getTime()
  }

  return new Date(value).getTime()
}

const loadRecords = async (inputPath) => {
  const content = await fsp.readFile(inputPath, 'utf8')
  const extension = path.extname(inputPath).toLowerCase()

  if (extension === '.json') {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return parsed
    }

    if (Array.isArray(parsed.records)) {
      return parsed.records
    }

    if (Array.isArray(parsed.data)) {
      return parsed.data
    }

    throw new Error('JSON 输入需为数组，或包含 records/data 数组字段')
  }

  if (extension === '.csv' || extension === '.tsv' || extension === '.txt') {
    return parseCsv(content)
  }

  throw new Error(`暂不支持的输入格式: ${extension}`)
}

const streamGridJsonl = async (inputPath, stepSeconds) => {
  const bucketMap = new Map()
  let weightedLngSum = 0
  let weightedLatSum = 0
  let totalWeight = 0
  let lineCount = 0

  const input = fs.createReadStream(inputPath, { encoding: 'utf8' })
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  })

  for await (const rawLine of rl) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    lineCount += 1

    let parsed
    try {
      parsed = JSON.parse(line)
    } catch {
      continue
    }

    const timestamp = parseTimestamp(parsed.time)
    if (!Number.isFinite(timestamp) || !Array.isArray(parsed.gridData)) {
      continue
    }

    const bucketTime = Math.floor(timestamp / (stepSeconds * 1000)) * stepSeconds * 1000
    const bucketKey = String(bucketTime)
    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, new Map())
    }

    const pointMap = bucketMap.get(bucketKey)
    parsed.gridData.forEach((grid) => {
      const [lng, lat] = Array.isArray(grid.gridGPS) ? grid.gridGPS : []
      const count = Number(grid.objNum)
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || !Number.isFinite(count) || count <= 0) {
        return
      }

      const pointKey = `${Number(lng).toFixed(6)},${Number(lat).toFixed(6)}`
      pointMap.set(pointKey, (pointMap.get(pointKey) ?? 0) + count)
      weightedLngSum += lng * count
      weightedLatSum += lat * count
      totalWeight += count
    })
  }

  if (!bucketMap.size || totalWeight === 0) {
    throw new Error(`没有从 ${inputPath} 解析出有效的网格数据`)
  }

  return {
    center: [
      Number((weightedLngSum / totalWeight).toFixed(6)),
      Number((weightedLatSum / totalWeight).toFixed(6)),
    ],
    frames: Array.from(bucketMap.entries())
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([bucketKey, pointMap]) => ({
        time: new Date(Number(bucketKey)).toISOString(),
        points: Array.from(pointMap.entries()).map(([pointKey, count]) => {
          const [lng, lat] = pointKey.split(',').map(Number)
          return [lng, lat, Math.round(count)]
        }),
      })),
    recordCount: lineCount,
    totalWeight,
  }
}

const loadDirectoryFrames = async (inputDir, stepSeconds) => {
  const entries = await fsp.readdir(inputDir, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(inputDir, entry.name))
    .sort()

  const mergedBucketMap = new Map()
  let weightedLngSum = 0
  let weightedLatSum = 0
  let totalWeight = 0
  let totalRecords = 0

  for (const filePath of files) {
    if (path.extname(filePath).toLowerCase() !== '.txt') {
      continue
    }

    const fileResult = await streamGridJsonl(filePath, stepSeconds)
    totalRecords += fileResult.recordCount
    weightedLngSum += fileResult.center[0] * fileResult.totalWeight
    weightedLatSum += fileResult.center[1] * fileResult.totalWeight
    totalWeight += fileResult.totalWeight

    fileResult.frames.forEach((frame) => {
      if (!mergedBucketMap.has(frame.time)) {
        mergedBucketMap.set(frame.time, new Map())
      }

      const pointMap = mergedBucketMap.get(frame.time)
      frame.points.forEach(([lng, lat, count]) => {
        const pointKey = `${lng.toFixed(6)},${lat.toFixed(6)}`
        pointMap.set(pointKey, (pointMap.get(pointKey) ?? 0) + count)
      })
    })
  }

  if (!mergedBucketMap.size || totalWeight === 0) {
    throw new Error(`目录 ${inputDir} 中没有可转换的 .txt 网格数据`)
  }

  return {
    center: [
      Number((weightedLngSum / totalWeight).toFixed(6)),
      Number((weightedLatSum / totalWeight).toFixed(6)),
    ],
    frames: Array.from(mergedBucketMap.entries())
      .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
      .map(([time, pointMap]) => ({
        time,
        points: Array.from(pointMap.entries()).map(([pointKey, count]) => {
          const [lng, lat] = pointKey.split(',').map(Number)
          return [lng, lat, Math.round(count)]
        }),
      })),
    recordCount: totalRecords,
  }
}

const normalizeRecords = (records, stepSeconds, gridSize) => {
  if (!records.length) {
    throw new Error('输入数据为空')
  }

  const sample = records[0]
  const timeKey =
    pickKey(sample, ['time', 'timestamp', 'datetime', 'date_time', 'event_time']) ?? 'time'
  const lngKey =
    pickKey(sample, ['longitude', 'lng', 'lon', 'x']) ?? 'longitude'
  const latKey =
    pickKey(sample, ['latitude', 'lat', 'y']) ?? 'latitude'
  const countKey =
    pickKey(sample, ['count', 'value', 'weight', 'flow', 'people', 'crowd']) ?? null

  const bucketMap = new Map()
  let weightedLngSum = 0
  let weightedLatSum = 0
  let totalWeight = 0

  records.forEach((record) => {
    const timeValue = resolveRecordValue(record, timeKey)
    const lngValue = Number(resolveRecordValue(record, lngKey))
    const latValue = Number(resolveRecordValue(record, latKey))
    const countValue = countKey ? Number(resolveRecordValue(record, countKey)) : 1
    const timestamp = parseTimestamp(timeValue)

    if (!Number.isFinite(timestamp) || !Number.isFinite(lngValue) || !Number.isFinite(latValue)) {
      return
    }

    const count = Number.isFinite(countValue) && countValue > 0 ? countValue : 1
    const bucketTime = Math.floor(timestamp / (stepSeconds * 1000)) * stepSeconds * 1000
    const snappedLng = gridSize > 0 ? Number((Math.round(lngValue / gridSize) * gridSize).toFixed(6)) : lngValue
    const snappedLat = gridSize > 0 ? Number((Math.round(latValue / gridSize) * gridSize).toFixed(6)) : latValue
    const bucketKey = String(bucketTime)
    const pointKey = `${snappedLng},${snappedLat}`

    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, new Map())
    }

    const pointMap = bucketMap.get(bucketKey)
    pointMap.set(pointKey, (pointMap.get(pointKey) ?? 0) + count)

    weightedLngSum += snappedLng * count
    weightedLatSum += snappedLat * count
    totalWeight += count
  })

  if (!bucketMap.size || totalWeight === 0) {
    throw new Error('没有解析出有效的人流点位，请检查字段名和时间格式')
  }

  const frames = Array.from(bucketMap.entries())
    .sort((left, right) => Number(left[0]) - Number(right[0]))
    .map(([bucketKey, pointMap]) => ({
      time: new Date(Number(bucketKey)).toISOString(),
      points: Array.from(pointMap.entries()).map(([pointKey, count]) => {
        const [lng, lat] = pointKey.split(',').map(Number)
        return [lng, lat, Math.round(count)]
      }),
    }))

  return {
    center: [Number((weightedLngSum / totalWeight).toFixed(6)), Number((weightedLatSum / totalWeight).toFixed(6))],
    frames,
  }
}

const main = async () => {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = args.input
  const outputPath = args.output ?? path.resolve('public/data/overview/crowd-heatmap-30s.json')
  const stepSeconds = Number(args.step ?? DEFAULT_STEP_SECONDS)
  const gridSize = Number(args.grid ?? DEFAULT_GRID_SIZE)
  const zoom = Number(args.zoom ?? DEFAULT_ZOOM)
  const defaultInputPath = path.resolve(DEFAULT_INPUT_DIR)

  if (!inputPath && !fs.existsSync(defaultInputPath)) {
    throw new Error('用法: node scripts/build-crowd-heatmap.mjs --input <csv|json|dir> [--output <json>]')
  }

  const absoluteInputPath = path.resolve(inputPath ?? defaultInputPath)
  const absoluteOutputPath = path.resolve(outputPath)
  const inputStat = await fsp.stat(absoluteInputPath)

  let center
  let frames
  let recordCount

  if (inputStat.isDirectory()) {
    ;({ center, frames, recordCount } = await loadDirectoryFrames(absoluteInputPath, stepSeconds))
  } else if (path.extname(absoluteInputPath).toLowerCase() === '.txt') {
    ;({ center, frames, recordCount } = await streamGridJsonl(absoluteInputPath, stepSeconds))
  } else {
    const records = await loadRecords(absoluteInputPath)
    ;({ center, frames } = normalizeRecords(records, stepSeconds, gridSize))
    recordCount = records.length
  }

  const payload = {
    meta: {
      dataLabel: args.label ?? path.basename(absoluteInputPath),
      center: [
        Number(args['center-lng'] ?? center[0]),
        Number(args['center-lat'] ?? center[1]),
      ],
      zoom,
      radius: Number(args.radius ?? 30),
      intensity: Number(args.intensity ?? 1.05),
      timeStepSeconds: stepSeconds,
    },
    frames,
  }

  await fsp.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
  await fsp.writeFile(absoluteOutputPath, `${JSON.stringify(payload)}\n`, 'utf8')

  process.stdout.write(
    `Generated ${frames.length} frames from ${recordCount} records -> ${absoluteOutputPath}\n`,
  )
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
