import { Station } from "@/lib/station/types"

interface MapBoxPopupProps {
  station: Station
}
export default function MapBoxPopup({ station }: MapBoxPopupProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-bold">{station.name}</h1>
      <p className="text-sm text-gray-500">{station.address.latitude}</p>
      <p className="text-sm text-gray-500">{station.address.longitude}</p>
    </div>
  )
}
