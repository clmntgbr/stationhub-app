import { Address } from "../address/types"
import { CurrentPrice } from "../price/types"

export interface Station {
  name: string
  id: string
  address: Address
  currentPrices: CurrentPrice[]
}

export interface GetStationsQuery {
  latitude: number
  longitude: number
  radius: number
}

export interface StationState {
  stations: Station[] | null
  isLoading: boolean
  error: string | null
}

export type StationAction =
  | { type: "GET_STATIONS"; payload: Station[] }
  | { type: "GET_STATIONS_ERROR"; payload: string }
  | { type: "GET_STATIONS_LOADING"; payload: boolean }
