"use client"

import { useCallback, useReducer } from "react"
import { getStations } from "./api"
import { StationContext } from "./context"
import { StationReducer } from "./reducer"
import { GetStationsQuery, StationState } from "./types"

const initialState: StationState = {
  stations: null,
  isLoading: false,
  error: null,
}

export function StationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(StationReducer, initialState)

  const fetchStations = useCallback(async (query: GetStationsQuery) => {
    try {
      dispatch({ type: "GET_STATIONS_LOADING", payload: true })
      const stations = await getStations(query)
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
