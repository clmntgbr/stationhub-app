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

export default function MapBox() {
  const { stations, fetchStations } = useStation()

  const mapRef = useRef<mapboxgl.Map>(null)
  const markersRef = useRef<MarkerMap>(new Map())

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: "map",
      center: DEFAULT_CENTER,
      zoom: 12,
    })
    mapRef.current = map

    let allowMoveEndFetch = false
    let lastFetchPosition: { lat: number; lng: number; zoom: number } | null =
      null

    const fetchDefaultStations = () => {
      const bounds = map.getBounds()
      if (!bounds) return

      const center = map.getCenter()
      const zoom = map.getZoom()
      const northPoint = bounds.getNorth()
      const R = 6371000
      const deltaLat = ((northPoint - center.lat) * Math.PI) / 180
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distanceInMeters = R * c
      const radiusInKm = (distanceInMeters / 1000) * 1.5 // Add 50% margin

      lastFetchPosition = { lat: center.lat, lng: center.lng, zoom }

      fetchStations({
        latitude: center.lat,
        longitude: center.lng,
        radius: radiusInKm,
      })
    }

    const calculateMapRadius = () => {
      const bounds = map.getBounds()
      if (!bounds) return

      const center = map.getCenter()

      const northPoint = bounds.getNorth()

      const R = 6371000
      const deltaLat = ((northPoint - center.lat) * Math.PI) / 180

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distanceInMeters = R * c
      const distanceInKm = distanceInMeters / 1000

      const zoom = map.getZoom()
      console.log(
        `Zoom: ${zoom.toFixed(2)} | Radius (height): ${distanceInKm.toFixed(2)} km | Full height: ${(distanceInKm * 2).toFixed(2)} km | API radius: ${(distanceInKm * 1.5).toFixed(2)} km`
      )

      return distanceInKm
    }

    const onMoveEnd = () => {
      const radiusInKm = calculateMapRadius()

      if (!allowMoveEndFetch || !radiusInKm) {
        return
      }

      const center = map.getCenter()
      const zoom = map.getZoom()

      // Check if position has significantly changed (>100m or zoom change > 0.5)
      if (lastFetchPosition) {
        const R = 6371000 // Earth radius in meters
        const lat1 = (lastFetchPosition.lat * Math.PI) / 180
        const lat2 = (center.lat * Math.PI) / 180
        const deltaLat = ((center.lat - lastFetchPosition.lat) * Math.PI) / 180
        const deltaLng = ((center.lng - lastFetchPosition.lng) * Math.PI) / 180

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c // Distance in meters

        const zoomDiff = Math.abs(zoom - lastFetchPosition.zoom)

        if (distance < 100 && zoomDiff < 0.5) {
          return
        }
      }

      lastFetchPosition = { lat: center.lat, lng: center.lng, zoom }

      fetchStations({
        latitude: center.lat,
        longitude: center.lng,
        radius: radiusInKm * 1.5, // Add 50% margin
      })
    }
    map.on("moveend", onMoveEnd)
    map.on("zoomend", calculateMapRadius)

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      fitBoundsOptions: {
        maxZoom: 12,
      },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(geolocate)

    geolocate.on("geolocate", () => {
      allowMoveEndFetch = true
    })
    geolocate.on("error", () => {
      allowMoveEndFetch = true
      fetchDefaultStations()

      const popup = new mapboxgl.Popup({ closeOnClick: true })
        .setLngLat(DEFAULT_CENTER)
        .setHTML(
          `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Unable to find your location</h3>
            <p style="margin: 0; font-size: 12px;">Showing default location (Paris). You can navigate to your area.</p>
          </div>
        `
        )
        .addTo(map)

      setTimeout(() => popup.remove(), 5000)
    })

    map.once("load", () => {
      calculateMapRadius()
      const started = geolocate.trigger()
      if (!started) {
        allowMoveEndFetch = true
        fetchDefaultStations()
      }
    })

    map.addControl(new mapboxgl.NavigationControl())

    return () => {
      map.off("moveend", onMoveEnd)
      map.off("zoomend", calculateMapRadius)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [fetchStations])

  useEffect(() => {
    if (!mapRef.current || !stations?.length) {
      return
    }

    const map = mapRef.current
    const markers = markersRef.current

    const currentStationIds = new Set(
      stations.map((s: Station) => s.externalId)
    )

    markers.forEach((marker, stationId) => {
      if (!currentStationIds.has(stationId)) {
        marker.remove()
        markers.delete(stationId)
      }
    })

    stations.forEach((station: Station) => {
      if (!markers.has(station.externalId)) {
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
      }
    })
  }, [stations])

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />
}
