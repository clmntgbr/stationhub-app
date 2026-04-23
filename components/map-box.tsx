import { useStation } from "@/lib/station/context"
import { Station } from "@/lib/station/types"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"

export default function MapBox() {
  const [latitude, setLatitude] = useState(48.852473724351974)
  const [longitude, setLongitude] = useState(2.3494312437081044)

  const { stations, fetchStations } = useStation()

  const mapRef = useRef<mapboxgl.Map>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: "map",
      center: [longitude, latitude],
      zoom: 12,
    })
    mapRef.current = map

    const onMoveEnd = () => {
      const center = map.getCenter()
      fetchStations({
        latitude: center.lat,
        longitude: center.lng,
        radius: 1000,
      })
    }
    map.on("moveend", onMoveEnd)

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    )

    map.addControl(new mapboxgl.NavigationControl())

    return () => {
      map.off("moveend", onMoveEnd)
      map.remove()
      mapRef.current = null
    }
  }, [fetchStations])

  useEffect(() => {
    fetchStations({
      latitude: latitude,
      longitude: longitude,
      radius: 1000,
    })
  }, [fetchStations, latitude, longitude])

  useEffect(() => {
    if (!mapRef.current || !stations?.length) {
      return
    }

    const map = mapRef.current
    const markers: mapboxgl.Marker[] = []

    stations.forEach((station: Station) => {
      const root = document.createElement("div")
      const markerEl = document.createElement("div")
      markerEl.className = "marker marker-pop"
      markerEl.style.backgroundImage = `url("https://docs.mapbox.com/mapbox-gl-js/assets/coffee-cup-marker.svg")`

      root.appendChild(markerEl)

      const marker = new mapboxgl.Marker({ element: root })
        .setLngLat([station.address.longitude, station.address.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${station.name}</h3>`)
        )
        .addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [stations])

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />
}
