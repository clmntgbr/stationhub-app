import { Station } from "@/lib/station/types"
import { cn } from "@/lib/utils"
import { Fuel, MapPin } from "lucide-react"
import Image from "next/image"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface MapBoxPopupProps {
  station: Station
}
export default function MapBoxPopup({ station }: MapBoxPopupProps) {
  return (
    <>
      <p>station.externalId: {station.externalId}</p>
      <Card className="w-[380px] overflow-hidden shadow-lg">
        <Image
          src={"/station.jpg"}
          alt={station.name}
          width={380}
          height={200}
          className="h-40 w-full object-cover"
        />

        <CardHeader className="pb-3">
          <CardTitle className="text-base leading-tight">
            {station.name}
          </CardTitle>

          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-snug">
              {station.address.streetLine1}, {station.address.city}{" "}
              {station.address.zip}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Derniers prix
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {station.currentPrices.map((p) => (
              <div
                key={p.type}
                className="flex items-center justify-between rounded-md border bg-muted/40 px-2.5 py-1.5"
              >
                <div className="flex flex-col">
                  <span className="text-xs leading-tight font-medium">
                    {p.type}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {p.updatedAt}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    p.isLowPrice
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {p.value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>

        {station.services?.length && station.services.length > 0 && (
          <>
            <CardContent className="pt-3 pb-3">
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Services
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {station.services.map((key) => {
                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="font-normal"
                    >
                      {key}
                    </Badge>
                  )
                })}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </>
  )
}
