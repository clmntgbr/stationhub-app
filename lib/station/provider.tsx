"use client"

import { useCallback, useEffect, useReducer } from "react"
import { getStations } from "./api"
import { StationContext } from "./context"
import { StationReducer } from "./reducer"
import { StationState } from "./types"

const initialState: StationState = {
  stations: null,
  isLoading: false,
  error: null,
}

export function StationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(StationReducer, initialState)

  const fetchStations = useCallback(async () => {
    try {
      dispatch({ type: "GET_STATIONS_LOADING", payload: true })
      const stations = await getStations({
        latitude: 10,
        longitude: 10,
        radius: 1000,
      })
      dispatch({ type: "GET_STATIONS", payload: stations })
    } catch {
      dispatch({
        type: "GET_STATIONS_ERROR",
        payload: "Failed to fetch stations",
      })
    } finally {
      dispatch({ type: "GET_STATIONS_LOADING", payload: false })
    }
  }, [])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  return (
    <StationContext.Provider
      value={{
        ...state,
        fetchStations,
      }}
    >
      {children}
    </StationContext.Provider>
  )
}
