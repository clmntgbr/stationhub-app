import { StationAction, StationState } from "./types"

export const StationReducer = (
  state: StationState,
  action: StationAction
): StationState => {
  switch (action.type) {
    case "GET_STATIONS":
      return {
        ...state,
        stations: action.payload,
        isLoading: false,
        error: null,
      }
    case "GET_STATIONS_ERROR":
      return {
        ...state,
        stations: null,
        isLoading: false,
        error: action.payload,
      }
    case "GET_STATIONS_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}
