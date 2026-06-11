import type { GeoLocation } from './types'

const PINS_KEY = 'tf_pins'

export function getPins(): GeoLocation[] {
  const raw = localStorage.getItem(PINS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function savePins(pins: GeoLocation[]): void {
  localStorage.setItem(PINS_KEY, JSON.stringify(pins))
}

export function addPin(loc: GeoLocation): void {
  const pins = getPins()
  const exists = pins.some(
    (p) =>
      p.city.toLowerCase() === loc.city.toLowerCase() &&
      p.country.toLowerCase() === loc.country.toLowerCase()
  )
  if (!exists) {
    pins.push(loc)
    savePins(pins)
  }
}

export function removePin(city: string, country: string): void {
  const pins = getPins()
  const filtered = pins.filter(
    (p) =>
      !(
        p.city.toLowerCase() === city.toLowerCase() &&
        p.country.toLowerCase() === country.toLowerCase()
      )
  )
  savePins(filtered)
}

export function isPinned(city: string, country: string): boolean {
  const pins = getPins()
  return pins.some(
    (p) =>
      p.city.toLowerCase() === city.toLowerCase() &&
      p.country.toLowerCase() === country.toLowerCase()
  )
}
