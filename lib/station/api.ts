import { Station } from "./types"

export const getStations = async (): Promise<Station[]> => {
  const response = await fetch("/api/af60e0fa9b0f4443bbb7fb384b46abe9", {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch stations")
  }

  return response.json()
}
