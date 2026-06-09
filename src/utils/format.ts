import type { TempUnit, SpeedUnit } from '../core/types'

export function formatTemp(celsius: number, unit: TempUnit = 'C'): string {
  if (unit === 'F') return `${Math.round(celsius * 9 / 5 + 32)}°F`
  return `${Math.round(celsius)}°C`
}

export function formatWind(kmh: number, unit: SpeedUnit = 'kmh'): string {
  if (unit === 'mph') return `${Math.round(kmh * 0.621)}mph`
  if (unit === 'ms') return `${Math.round(kmh / 3.6)}m/s`
  return `${Math.round(kmh)}km/h`
}

export function formatWindDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

export function formatDay(iso: string, short = false): string {
  const date = new Date(iso)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' })
}

export function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}
