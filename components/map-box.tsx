import { useStation } from "@/lib/station/context"
import { Station } from "@/lib/station/types"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef } from "react"

export default function MapBox() {
  const { stations } = useStation()

  const mapRef = useRef<mapboxgl.Map>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    mapboxgl.accessToken = token

    mapRef.current = new mapboxgl.Map({
      container: "map",
      center: [2.3494312437081044, 48.852473724351974],
      zoom: 12,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl())
  }, [])

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

  return <div id="map" style={{ width: "100vw", height: "90vh" }} />
}
