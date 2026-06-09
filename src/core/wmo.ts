import type { WeatherIcon, WMOCode } from './types'

export const WMO_ICONS: Record<WMOCode, WeatherIcon> = {
  0:  { day: '☀️', night: '🌙', label: 'Clear sky',         bg: 'bg-clear-day' },
  1:  { day: '🌤️', night: '🌤️', label: 'Mainly clear',      bg: 'bg-clear-day' },
  2:  { day: '⛅',  night: '⛅',  label: 'Partly cloudy',     bg: 'bg-cloudy' },
  3:  { day: '☁️',  night: '☁️',  label: 'Overcast',          bg: 'bg-cloudy' },
  45: { day: '🌫️', night: '🌫️', label: 'Fog',               bg: 'bg-fog' },
  48: { day: '🌫️', night: '🌫️', label: 'Icy fog',           bg: 'bg-fog' },
  51: { day: '🌦️', night: '🌦️', label: 'Light drizzle',     bg: 'bg-rain' },
  53: { day: '🌦️', night: '🌦️', label: 'Drizzle',           bg: 'bg-rain' },
  55: { day: '🌧️', night: '🌧️', label: 'Heavy drizzle',     bg: 'bg-rain' },
  61: { day: '🌧️', night: '🌧️', label: 'Slight rain',       bg: 'bg-rain' },
  63: { day: '🌧️', night: '🌧️', label: 'Rain',              bg: 'bg-rain' },
  65: { day: '🌧️', night: '🌧️', label: 'Heavy rain',        bg: 'bg-rain' },
  71: { day: '🌨️', night: '🌨️', label: 'Slight snow',       bg: 'bg-snow' },
  73: { day: '🌨️', night: '🌨️', label: 'Snow',              bg: 'bg-snow' },
  75: { day: '❄️',  night: '❄️',  label: 'Heavy snow',        bg: 'bg-snow' },
  77: { day: '🌨️', night: '🌨️', label: 'Snow grains',       bg: 'bg-snow' },
  80: { day: '🌦️', night: '🌦️', label: 'Slight showers',    bg: 'bg-rain' },
  81: { day: '🌧️', night: '🌧️', label: 'Rain showers',      bg: 'bg-rain' },
  82: { day: '⛈️',  night: '⛈️',  label: 'Heavy showers',     bg: 'bg-storm' },
  85: { day: '🌨️', night: '🌨️', label: 'Snow showers',      bg: 'bg-snow' },
  86: { day: '🌨️', night: '🌨️', label: 'Heavy snow showers',bg: 'bg-snow' },
  95: { day: '⛈️',  night: '⛈️',  label: 'Thunderstorm',      bg: 'bg-storm' },
  96: { day: '⛈️',  night: '⛈️',  label: 'Thunderstorm + hail', bg: 'bg-storm' },
  99: { day: '⛈️',  night: '⛈️',  label: 'Thunderstorm + heavy hail', bg: 'bg-storm' },
}

export function getWeatherIcon(code: WMOCode, isDay: boolean): WeatherIcon {
  const icon = WMO_ICONS[code]
  if (!icon) return { day: '🌡️', night: '🌡️', label: 'Unknown', bg: 'bg-default' }
  return icon
}

export function getIcon(code: WMOCode, isDay: boolean): string {
  const w = getWeatherIcon(code, isDay)
  return isDay ? w.day : w.night
}

export function getLabel(code: WMOCode): string {
  return WMO_ICONS[code]?.label ?? 'Unknown'
}
