import './style.css'
import { getGPS, reverseGeocode, searchCity, saveGeoCache, loadGeoCache } from './core/geo'
import { fetchWeather } from './core/weather'
import { renderApp, renderLoading, renderError, renderSearch } from './ui/render'
import type { GeoLocation, AppSettings } from './core/types'

// ─── App State ────────────────────────────────────────────────────────────────

const settings: AppSettings = {
  tempUnit: (localStorage.getItem('tf_unit') as 'C' | 'F') ?? 'C',
  speedUnit: 'kmh',
}

const root = document.getElementById('app')!

// ─── Main ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  renderLoading(root)

  try {
    // try cache first
    let geo = loadGeoCache()

    if (!geo) {
      const coords = await getGPS()
      geo = await reverseGeocode(coords.lat, coords.lon)
      saveGeoCache(geo)
    }

    await loadWeather(geo)
  } catch (err) {
    console.error(err)
    renderError(root, 'Could not get your location.<br>Allow location access and try again.')
    document.getElementById('retry-btn')?.addEventListener('click', init)
  }
}

async function loadWeather(geo: GeoLocation): Promise<void> {
  try {
    const data = await fetchWeather(geo.lat, geo.lon)
    renderApp(root, geo, data, settings)
    bindEvents(geo)
  } catch (err) {
    console.error(err)
    renderError(root, 'Could not fetch weather data. Please try again.')
    document.getElementById('retry-btn')?.addEventListener('click', () => loadWeather(geo))
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents(_currentGeo: GeoLocation): void {
  // Search
  document.getElementById('search-btn')?.addEventListener('click', () => openSearch())
}

function openSearch(): void {
  renderSearch(root)

  const input = document.getElementById('search-input') as HTMLInputElement
  const results = document.getElementById('search-results')!
  const closeBtn = document.getElementById('search-close')!
  const overlay = document.getElementById('search-overlay')!

  let debounce: ReturnType<typeof setTimeout>

  input.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(async () => {
      const q = input.value.trim()
      if (q.length < 2) { results.innerHTML = ''; return }

      results.innerHTML = `<div class="p-4 text-white/40 font-mono text-sm">Searching...</div>`
      const cities = await searchCity(q)

      if (cities.length === 0) {
        results.innerHTML = `<div class="p-4 text-white/40 font-mono text-sm">No results</div>`
        return
      }

      results.innerHTML = cities.map((c, i) => `
        <button
          class="search-result w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
          data-index="${i}"
        >
          <span class="text-white text-sm">${c.city}</span>
          <span class="text-white/40 text-xs ml-2">${c.country}</span>
        </button>
      `).join('')

      // store results for click handler
      ;(window as any).__tfSearchResults = cities
    }, 300)
  })

  results.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest('.search-result') as HTMLElement | null
    if (!btn) return
    const idx = parseInt(btn.dataset.index ?? '0')
    const cities: GeoLocation[] = (window as any).__tfSearchResults ?? []
    const selected = cities[idx]
    if (!selected) return

    saveGeoCache(selected)
    overlay.remove()
    renderLoading(root)
    await loadWeather(selected)
  })

  closeBtn.addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay.firstElementChild) overlay.remove()
  })
}

// ─── Start ────────────────────────────────────────────────────────────────────

init()
