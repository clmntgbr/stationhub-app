import { useStation } from "@/lib/station/context"
import { Station } from "@/lib/station/types"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"
import { createRoot } from "react-dom/client"
import MapBoxPopup from "./map-box-popup"

type MarkerMap = Map<string, mapboxgl.Marker>

const DEFAULT_CENTER: [number, number] = [
  2.3494312437081044, 48.852473724351974,
]
const FETCH_DEBOUNCE_MS = 400
const MIN_MOVE_METERS = 200
const MIN_ZOOM_DELTA = 0.5

function getMapRadius(map: mapboxgl.Map): number {
  const bounds = map.getBounds()
  const center = map.getCenter()
  const northPoint = bounds?.getNorth() ?? 0
  const R = 6371000
  const deltaLat = ((northPoint - center.lat) * Math.PI) / 180
  const a = Math.sin(deltaLat / 2) ** 2
  const distanceKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000
  return distanceKm * 1.5
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function MapBox() {
  const { stations, fetchStations } = useStation()
  const mapRef = useRef<mapboxgl.Map>(null)
  const markersRef = useRef<MarkerMap>(new Map())

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

    const map = new mapboxgl.Map({
      container: "map",
      center: DEFAULT_CENTER,
      zoom: 12,
    })
    mapRef.current = map

    let enabled = false
    let lastFetch: { lat: number; lng: number; zoom: number } | null = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const doFetch = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()

      if (lastFetch) {
        const moved = haversineMeters(
          lastFetch.lat,
          lastFetch.lng,
          center.lat,
          center.lng
        )
        const zoomed = Math.abs(zoom - lastFetch.zoom)
        if (moved < MIN_MOVE_METERS && zoomed < MIN_ZOOM_DELTA) return
      }

      lastFetch = { lat: center.lat, lng: center.lng, zoom }
      fetchStations({
        latitude: center.lat,
        longitude: center.lng,
        radius: getMapRadius(map),
      })
    }

    const onMoveEnd = () => {
      if (!enabled) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(doFetch, FETCH_DEBOUNCE_MS)
    }

    map.on("moveend", onMoveEnd)

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      fitBoundsOptions: { maxZoom: 12 },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(geolocate)
    map.addControl(new mapboxgl.NavigationControl())

    const enableAndFetch = () => {
      enabled = true
      doFetch()
    }

    geolocate.on("geolocate", () => {
      enabled = true
    })
    geolocate.on("error", () => {
      enableAndFetch()
      const popup = new mapboxgl.Popup({ closeOnClick: true })
        .setLngLat(DEFAULT_CENTER)
        .setHTML(
          `
          <div style="padding:10px">
            <h3 style="margin:0 0 8px;font-size:14px;font-weight:bold">Unable to find your location</h3>
            <p style="margin:0;font-size:12px">Showing default location (Paris). You can navigate to your area.</p>
          </div>
        `
        )
        .addTo(map)
      setTimeout(() => popup.remove(), 5000)
    })

    map.once("load", () => {
      const started = geolocate.trigger()
      if (!started) enableAndFetch()
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      map.off("moveend", onMoveEnd)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [fetchStations])

  useEffect(() => {
    if (!mapRef.current || !stations?.length) return

    const map = mapRef.current
    const markers = markersRef.current
    const currentIds = new Set(stations.map((s: Station) => s.externalId))

    markers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    })

    stations.forEach((station: Station) => {
      if (markers.has(station.externalId)) return

      const root = document.createElement("div")
      const markerEl = document.createElement("div")
      markerEl.className = "marker marker-pop"
      markerEl.style.backgroundImage = `url("https://docs.mapbox.com/mapbox-gl-js/assets/coffee-cup-marker.svg")`
      root.appendChild(markerEl)

      const popupNode = document.createElement("div")
      createRoot(popupNode).render(<MapBoxPopup station={station} />)

      const marker = new mapboxgl.Marker({ element: root })
        .setLngLat([station.address.longitude, station.address.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupNode))
        .addTo(map)

      markers.set(station.externalId, marker)
    })
  }, [stations])

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />
}
