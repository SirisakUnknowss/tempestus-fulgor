import type { WeatherIcon, WMOCode } from './types'

export const WMO_ICONS: Record<WMOCode, WeatherIcon> = {
  0: { day: '<i class="ph-duotone ph-sun"></i>', night: '<i class="ph-duotone ph-moon"></i>', label: 'Clear sky', bg: 'bg-clear-day' },
  1: { day: '<i class="ph-duotone ph-cloud-sun"></i>', night: '<i class="ph-duotone ph-cloud-moon"></i>', label: 'Mainly clear', bg: 'bg-clear-day' },
  2: { day: '<i class="ph-duotone ph-cloud-sun"></i>', night: '<i class="ph-duotone ph-cloud-moon"></i>', label: 'Partly cloudy', bg: 'bg-cloudy' },
  3: { day: '<i class="ph-duotone ph-cloud"></i>', night: '<i class="ph-duotone ph-cloud"></i>', label: 'Overcast', bg: 'bg-cloudy' },
  45: { day: '<i class="ph-duotone ph-cloud-fog"></i>', night: '<i class="ph-duotone ph-cloud-fog"></i>', label: 'Fog', bg: 'bg-fog' },
  48: { day: '<i class="ph-duotone ph-cloud-fog"></i>', night: '<i class="ph-duotone ph-cloud-fog"></i>', label: 'Icy fog', bg: 'bg-fog' },
  51: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Light drizzle', bg: 'bg-rain' },
  53: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Drizzle', bg: 'bg-rain' },
  55: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Heavy drizzle', bg: 'bg-rain' },
  61: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Slight rain', bg: 'bg-rain' },
  63: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Rain', bg: 'bg-rain' },
  65: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Heavy rain', bg: 'bg-rain' },
  71: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Slight snow', bg: 'bg-snow' },
  73: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Snow', bg: 'bg-snow' },
  75: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Heavy snow', bg: 'bg-snow' },
  77: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Snow grains', bg: 'bg-snow' },
  80: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Slight showers', bg: 'bg-rain' },
  81: { day: '<i class="ph-duotone ph-cloud-rain"></i>', night: '<i class="ph-duotone ph-cloud-rain"></i>', label: 'Rain showers', bg: 'bg-rain' },
  82: { day: '<i class="ph-duotone ph-cloud-lightning"></i>', night: '<i class="ph-duotone ph-cloud-lightning"></i>', label: 'Heavy showers', bg: 'bg-storm' },
  85: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Snow showers', bg: 'bg-snow' },
  86: { day: '<i class="ph-duotone ph-cloud-snow"></i>', night: '<i class="ph-duotone ph-cloud-snow"></i>', label: 'Heavy snow showers', bg: 'bg-snow' },
  95: { day: '<i class="ph-duotone ph-cloud-lightning"></i>', night: '<i class="ph-duotone ph-cloud-lightning"></i>', label: 'Thunderstorm', bg: 'bg-storm' },
  96: { day: '<i class="ph-duotone ph-cloud-lightning"></i>', night: '<i class="ph-duotone ph-cloud-lightning"></i>', label: 'Thunderstorm + hail', bg: 'bg-storm' },
  99: { day: '<i class="ph-duotone ph-cloud-lightning"></i>', night: '<i class="ph-duotone ph-cloud-lightning"></i>', label: 'Thunderstorm + heavy hail', bg: 'bg-storm' },
}

export function getWeatherIcon(code: WMOCode, _isDay: boolean): WeatherIcon {
  const icon = WMO_ICONS[code]
  if (!icon) return { day: '<i class="ph-duotone ph-question"></i>', night: '<i class="ph-duotone ph-question"></i>', label: 'Unknown', bg: 'bg-default' }
  return icon
}

export function getIcon(code: WMOCode, isDay: boolean): string {
  const w = getWeatherIcon(code, isDay)
  return isDay ? w.day : w.night
}

export function getLabel(code: WMOCode): string {
  return WMO_ICONS[code]?.label ?? 'Unknown'
}
