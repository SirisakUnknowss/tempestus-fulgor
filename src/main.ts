import './style.css'
import { getGPS, reverseGeocode, searchCity, saveGeoCache, loadGeoCache } from './core/geo'
import { fetchWeather } from './core/weather'
import { renderApp, renderLoading, renderError, renderDrawer, renderLocationCardHTML, renderDetailsDrawer } from './ui/render'
import type { GeoLocation, AppSettings, WeatherData } from './core/types'
import { getPins, addPin, removePin, isPinned } from './core/pins'

// ─── App State ────────────────────────────────────────────────────────────────

const settings: AppSettings = {
  tempUnit: (localStorage.getItem('tf_unit') as 'C' | 'F') ?? 'C',
  speedUnit: (localStorage.getItem('tf_speed_unit') as 'kmh' | 'mph' | 'ms') ?? 'kmh',
}

const root = document.getElementById('app')!

let currentGPSGeo: GeoLocation | null = null
let currentGPSWeather: WeatherData | null = null
const pinWeatherMap: Record<string, WeatherData> = {}

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

    currentGPSGeo = geo
    await loadWeather(geo)

    // Trigger silent update for GPS in background if we loaded from cache
    if (localStorage.getItem('tf_geo')) {
      getGPS()
        .then((coords) => reverseGeocode(coords.lat, coords.lon))
        .then((gps) => {
          currentGPSGeo = gps
        })
        .catch((err) => console.warn('Silent GPS update failed:', err))
    }
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
    bindEvents(geo, data)
  } catch (err) {
    console.error(err)
    renderError(root, 'Could not fetch weather data. Please try again.')
    document.getElementById('retry-btn')?.addEventListener('click', () => loadWeather(geo))
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents(geo: GeoLocation, data: WeatherData): void {

  // Details Modal
  document.getElementById('details-btn')?.addEventListener('click', () => {
    renderDetailsDrawer(root, data, settings)
  })

  // Hamburger Locations Menu
  document.getElementById('hamburger-btn')?.addEventListener('click', () => openDrawer())

  // Temperature unit toggle
  document.getElementById('temp-toggle-btn')?.addEventListener('click', () => {
    settings.tempUnit = settings.tempUnit === 'C' ? 'F' : 'C'
    localStorage.setItem('tf_unit', settings.tempUnit)
    renderApp(root, geo, data, settings)
    bindEvents(geo, data) // Rebind after DOM update
  })

  // Wind speed unit toggle
  document.getElementById('speed-toggle-btn')?.addEventListener('click', () => {
    const units: ('kmh' | 'mph' | 'ms')[] = ['kmh', 'mph', 'ms']
    const currentIndex = units.indexOf(settings.speedUnit)
    const nextIndex = (currentIndex + 1) % units.length
    settings.speedUnit = units[nextIndex]
    localStorage.setItem('tf_speed_unit', settings.speedUnit)
    renderApp(root, geo, data, settings)
    bindEvents(geo, data) // Rebind after DOM update
  })
}

function openDrawer(): void {
  renderDrawer(root)

  const backdrop = document.getElementById('drawer-backdrop')!
  const closeBtn = document.getElementById('drawer-close')!
  const searchInput = document.getElementById('drawer-search-input') as HTMLInputElement
  const searchResults = document.getElementById('drawer-search-results')!
  const locationsList = document.getElementById('drawer-locations-list')!

  // Focus search input
  if (searchInput) {
    searchInput.focus()
  }

  let debounce: ReturnType<typeof setTimeout>

  const closeDrawer = () => {
    backdrop.classList.remove('open')
    document.removeEventListener('keydown', handleKeyDown)
    setTimeout(() => {
      backdrop.remove()
    }, 300)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDrawer()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  closeBtn.addEventListener('click', closeDrawer)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer()
  })

  // Render Locations List (Current + Pinned)
  const drawLocationsList = () => {
    const pins = getPins()
    let html = ''

    // 1. Current Location card
    if (currentGPSGeo) {
      html += `<div id="current-location-card-container">`
      html += renderLocationCardHTML(currentGPSGeo, true, currentGPSWeather, settings)
      html += `</div>`
    } else {
      html += `<div id="current-location-card-container">`
      html += renderLocationCardHTML(
        { lat: 0, lon: 0, city: 'Current Location', country: '' },
        true,
        null,
        settings
      )
      html += `</div>`
    }

    // 2. Pinned Location cards
    pins.forEach((pin) => {
      const roundedLat = pin.lat.toFixed(2)
      const roundedLon = pin.lon.toFixed(2)
      const key = `${roundedLat}_${roundedLon}`
      const weather = pinWeatherMap[key] || null

      html += `<div id="pin-card-container-${roundedLat}-${roundedLon}">`
      html += renderLocationCardHTML(pin, false, weather, settings)
      html += `</div>`
    })

    locationsList.innerHTML = html

    // Asynchronously fetch weather data for pinned cards
    pins.forEach(async (pin) => {
      const roundedLat = pin.lat.toFixed(2)
      const roundedLon = pin.lon.toFixed(2)
      const key = `${roundedLat}_${roundedLon}`

      if (!pinWeatherMap[key]) {
        try {
          const weather = await fetchWeather(pin.lat, pin.lon)
          pinWeatherMap[key] = weather

          // Update card in place
          const cardContainer = document.getElementById(
            `pin-card-container-${roundedLat}-${roundedLon}`
          )
          if (cardContainer) {
            cardContainer.innerHTML = renderLocationCardHTML(pin, false, weather, settings)
          }
        } catch (err) {
          console.error(`Failed to fetch weather for pin ${pin.city}:`, err)
        }
      }
    })

    // Fetch weather for Current GPS Location if needed
    if (currentGPSGeo && !currentGPSWeather) {
      fetchWeather(currentGPSGeo.lat, currentGPSGeo.lon)
        .then((weather) => {
          currentGPSWeather = weather
          const cardContainer = document.getElementById('current-location-card-container')
          if (cardContainer && currentGPSGeo) {
            cardContainer.innerHTML = renderLocationCardHTML(currentGPSGeo, true, weather, settings)
          }
        })
        .catch((err) => console.error('Failed to fetch weather for current location:', err))
    }
  }

  // Draw list initial state
  drawLocationsList()

  // Handle Input for Search
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(async () => {
      const q = searchInput.value.trim()
      if (q.length < 2) {
        searchResults.innerHTML = ''
        return
      }

      searchResults.innerHTML = `<div class="p-3 text-slate-500 font-mono text-xs">Searching...</div>`
      const cities = await searchCity(q)

      if (cities.length === 0) {
        searchResults.innerHTML = `<div class="p-3 text-slate-500 font-mono text-xs">No results</div>`
        return
      }

      searchResults.innerHTML = cities
        .map(
          (c, i) => {
            const pinned = isPinned(c.city, c.country)
            return `
              <div class="search-result flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 transition-colors">
                <button
                  class="search-select-btn flex-1 text-left cursor-pointer"
                  data-index="${i}"
                >
                  <span class="text-slate-800 text-sm block font-medium truncate">${c.city}</span>
                  <span class="text-slate-500 text-xs block truncate">${c.country}</span>
                </button>
                <button
                  class="pin-toggle-btn p-1.5 rounded-lg text-xs font-semibold ${
                    pinned
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  } transition-all cursor-pointer shrink-0"
                  data-index="${i}"
                >
                  ${pinned ? '📌 Pinned' : '＋ Pin'}
                </button>
              </div>
            `
          }
        )
        .join('')

      // store results for click handler
      ;(window as any).__tfSearchResults = cities
    }, 300)
  })

  // Handle Search Result Selection & Pinning
  searchResults.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement

    // Pin Toggle
    const pinBtn = target.closest('.pin-toggle-btn') as HTMLButtonElement | null
    if (pinBtn) {
      const idx = parseInt(pinBtn.dataset.index!)
      const cities: GeoLocation[] = (window as any).__tfSearchResults ?? []
      const selected = cities[idx]
      if (!selected) return

      const pinned = isPinned(selected.city, selected.country)
      if (!pinned) {
        addPin(selected)
        pinBtn.className =
          'pin-toggle-btn p-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shrink-0'
        pinBtn.innerText = '📌 Pinned'
        drawLocationsList()
      } else {
        removePin(selected.city, selected.country)
        pinBtn.className =
          'pin-toggle-btn p-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer shrink-0'
        pinBtn.innerText = '＋ Pin'
        drawLocationsList()
      }
      return
    }

    // City Selection
    const selectBtn = target.closest('.search-select-btn') as HTMLButtonElement | null
    if (selectBtn) {
      const idx = parseInt(selectBtn.dataset.index!)
      const cities: GeoLocation[] = (window as any).__tfSearchResults ?? []
      const selected = cities[idx]
      if (!selected) return

      saveGeoCache(selected)
      closeDrawer()
      renderLoading(root)
      await loadWeather(selected)
    }
  })

  // Handle Card Click (Selection) & Unpinning inside the list
  locationsList.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement

    // Unpin button
    const unpinBtn = target.closest('.unpin-btn') as HTMLButtonElement | null
    if (unpinBtn) {
      e.stopPropagation()
      const city = unpinBtn.dataset.city!
      const country = unpinBtn.dataset.country!
      removePin(city, country)
      drawLocationsList()
      return
    }

    // Location Card Click
    const card = target.closest('.location-card') as HTMLElement | null
    if (card) {
      const lat = parseFloat(card.dataset.lat!)
      const lon = parseFloat(card.dataset.lon!)
      const city = card.dataset.city!
      const country = card.dataset.country!

      const selected: GeoLocation = { lat, lon, city, country }
      saveGeoCache(selected)
      closeDrawer()
      renderLoading(root)
      await loadWeather(selected)
    }
  })
}

// ─── Start ────────────────────────────────────────────────────────────────────

init()
