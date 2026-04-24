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

    const fetchDefaultStations = () => {
      fetchStations({
        latitude: DEFAULT_CENTER[1],
        longitude: DEFAULT_CENTER[0],
        radius: 1000,
      })
    }

    const onMoveEnd = () => {
      if (!allowMoveEndFetch) {
        return
      }
      const center = map.getCenter()
      fetchStations({
        latitude: center.lat,
        longitude: center.lng,
        radius: 1000,
      })
    }
    map.on("moveend", onMoveEnd)

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
    })

    map.once("load", () => {
      const started = geolocate.trigger()
      if (!started) {
        allowMoveEndFetch = true
        fetchDefaultStations()
      }
    })

    map.addControl(new mapboxgl.NavigationControl())

    return () => {
      map.off("moveend", onMoveEnd)
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

    // Remove markers for stations that are no longer in the list
    markers.forEach((marker, stationId) => {
      if (!currentStationIds.has(stationId)) {
        marker.remove()
        markers.delete(stationId)
      }
    })

    // Add markers for new stations
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
