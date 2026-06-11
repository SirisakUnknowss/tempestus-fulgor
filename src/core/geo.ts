import type { GeoLocation } from './types'

const GEO_CACHE_KEY = 'tf_geo'

// ─── Browser GPS ──────────────────────────────────────────────────────────────

export function getGPS(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 600_000 }
    )
  })
}

// ─── Reverse Geocode (Nominatim) ──────────────────────────────────────────────

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'TempestusApp/1.0' },
  })
  if (!res.ok) throw new Error('Geocode failed')
  const data = await res.json()
  const addr = data.address ?? {}
  const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state ?? 'Unknown'
  const country = addr.country_code?.toUpperCase() ?? ''
  return { lat, lon, city, country }
}

// ─── Search City ──────────────────────────────────────────────────────────────

export async function searchCity(query: string): Promise<GeoLocation[]> {
  if (query.trim().length < 2) return []
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&featuretype=city`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'TempestusApp/1.0' },
  })
  if (!res.ok) return []
  const data: any[] = await res.json()
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    city: item.display_name.split(',')[0],
    country: item.display_name.split(',').at(-1)?.trim() ?? '',
  }))
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export function saveGeoCache(loc: GeoLocation): void {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(loc))
}

export function loadGeoCache(): GeoLocation | null {
  const raw = localStorage.getItem(GEO_CACHE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
