// ─── Geo ──────────────────────────────────────────────────────────────────────

export interface GeoLocation {
  lat: number
  lon: number
  city: string
  country: string
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export interface WeatherCurrent {
  temperature: number // °C
  feelsLike: number // °C
  humidity: number // %
  weatherCode: number // WMO code
  windSpeed: number // km/h
  windDirection: number // °
  pressure: number // hPa
  uvIndex: number
  isDay: boolean
}

export interface WeatherHourly {
  time: string[]
  temperature: number[]
  precipitationProbability: number[]
  weatherCode: number[]
  windSpeed: number[]
}

export interface WeatherDaily {
  time: string[]
  weatherCode: number[]
  tempMax: number[]
  tempMin: number[]
  precipitationSum: number[]
  precipitationProbabilityMax: number[]
  sunrise: string[]
  sunset: string[]
  uvIndexMax: number[]
}

export interface AirQuality {
  aqi: number
  pm25: number
  pm10: number
}

export interface WeatherData {
  current: WeatherCurrent
  hourly: WeatherHourly
  daily: WeatherDaily
  aqi: AirQuality
  fetchedAt: number // timestamp for cache
}

// ─── WMO Weather Codes ────────────────────────────────────────────────────────

export interface WeatherIcon {
  day: string
  night: string
  label: string
  bg: string // CSS class สำหรับ dynamic background
}

export type WMOCode = number

// ─── App State ────────────────────────────────────────────────────────────────

export type TempUnit = 'C' | 'F'
export type SpeedUnit = 'kmh' | 'mph' | 'ms'

export interface AppSettings {
  tempUnit: TempUnit
  speedUnit: SpeedUnit
}
