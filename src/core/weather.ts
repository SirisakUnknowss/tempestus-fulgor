import type { WeatherData, WeatherCurrent, WeatherHourly, WeatherDaily, AirQuality } from './types'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const CACHE_KEY = (lat: number, lon: number) => `tf_weather_${lat.toFixed(2)}_${lon.toFixed(2)}`

// ─── Fetch Open-Meteo & Air Quality ───────────────────────────────────────────

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  // check cache first
  const cached = loadCache(lat, lon)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weathercode',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'uv_index',
      'is_day',
    ].join(','),
    hourly: ['temperature_2m', 'precipitation_probability', 'weathercode', 'wind_speed_10m'].join(
      ','
    ),
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '7',
    forecast_hours: '24',
  })

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?${params}`
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`

  const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)])

  if (!weatherRes.ok) throw new Error(`Weather fetch failed: ${weatherRes.status}`)
  if (!aqiRes.ok) throw new Error(`Air Quality fetch failed: ${aqiRes.status}`)

  const [weatherRaw, aqiRaw] = await Promise.all([weatherRes.json(), aqiRes.json()])

  const data = parseResponse(weatherRaw, aqiRaw)
  saveCache(lat, lon, data)
  return data
}

// ─── Parse ────────────────────────────────────────────────────────────────────

function parseResponse(raw: any, aqiRaw: any): WeatherData {
  const c = raw.current
  const h = raw.hourly
  const d = raw.daily
  const aq = aqiRaw.current

  const current: WeatherCurrent = {
    temperature: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    weatherCode: c.weathercode,
    windSpeed: c.wind_speed_10m,
    windDirection: c.wind_direction_10m,
    pressure: c.surface_pressure,
    uvIndex: c.uv_index,
    isDay: c.is_day === 1,
  }

  const hourly: WeatherHourly = {
    time: h.time,
    temperature: h.temperature_2m,
    precipitationProbability: h.precipitation_probability,
    weatherCode: h.weathercode,
    windSpeed: h.wind_speed_10m,
  }

  const daily: WeatherDaily = {
    time: d.time,
    weatherCode: d.weathercode,
    tempMax: d.temperature_2m_max,
    tempMin: d.temperature_2m_min,
    precipitationSum: d.precipitation_sum,
    precipitationProbabilityMax: d.precipitation_probability_max,
    sunrise: d.sunrise,
    sunset: d.sunset,
    uvIndexMax: d.uv_index_max,
  }

  const aqi: AirQuality = {
    aqi: aq.us_aqi,
    pm25: aq.pm2_5,
    pm10: aq.pm10,
  }

  return { current, hourly, daily, aqi, fetchedAt: Date.now() }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function saveCache(lat: number, lon: number, data: WeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY(lat, lon), JSON.stringify(data))
  } catch {
    // localStorage full — ignore
  }
}

function loadCache(lat: number, lon: number): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(lat, lon))
    if (!raw) return null
    const data: WeatherData = JSON.parse(raw)
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}
