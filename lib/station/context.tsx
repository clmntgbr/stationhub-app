"use client"

import { createContext, useContext } from "react"
import { StationState } from "./types"

export interface StationContextType extends StationState {
  fetchStations: () => Promise<void>
}

export const StationContext = createContext<StationContextType | undefined>(
  undefined
)

export const useStation = () => {
  const context = useContext(StationContext)
  if (!context) {
    throw new Error("useStation must be used within StationProvider")
  }
  return context
}
