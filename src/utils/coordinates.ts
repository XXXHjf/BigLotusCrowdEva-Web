const PI = Math.PI
const A = 6378245.0
const EE = 0.006693421622965943

const outOfChina = (lng: number, lat: number) =>
  lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271

const transformLat = (lng: number, lat: number) => {
  let result =
    -100 +
    2 * lng +
    3 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng))

  result +=
    ((20 * Math.sin(6 * lng * PI) + 20 * Math.sin(2 * lng * PI)) * 2) / 3
  result +=
    ((20 * Math.sin(lat * PI) + 40 * Math.sin((lat / 3) * PI)) * 2) / 3
  result +=
    ((160 * Math.sin((lat / 12) * PI) + 320 * Math.sin((lat * PI) / 30)) * 2) / 3

  return result
}

const transformLng = (lng: number, lat: number) => {
  let result =
    300 +
    lng +
    2 * lat +
    0.1 * lng * lng +
    0.1 * lng * lat +
    0.1 * Math.sqrt(Math.abs(lng))

  result +=
    ((20 * Math.sin(6 * lng * PI) + 20 * Math.sin(2 * lng * PI)) * 2) / 3
  result +=
    ((20 * Math.sin(lng * PI) + 40 * Math.sin((lng / 3) * PI)) * 2) / 3
  result +=
    ((150 * Math.sin((lng / 12) * PI) + 300 * Math.sin((lng / 30) * PI)) * 2) / 3

  return result
}

export const wgs84ToGcj02 = (
  lng: number,
  lat: number,
): [lng: number, lat: number] => {
  if (outOfChina(lng, lat)) {
    return [lng, lat]
  }

  const dLat = transformLat(lng - 105, lat - 35)
  const dLng = transformLng(lng - 105, lat - 35)
  const radLat = (lat / 180) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)

  const mgLat =
    lat + ((dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI))
  const mgLng =
    lng + ((dLng * 180) / ((A / sqrtMagic) * Math.cos(radLat) * PI))

  return [Number(mgLng.toFixed(6)), Number(mgLat.toFixed(6))]
}
