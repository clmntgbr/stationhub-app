export interface Price {
  id: string
  value: number
  currency: string
  isLowestPrice: boolean
  date: string
  type: string
  createdAt: string
  updatedAt: string
}

export type CurrentPrice = Price
export type PriceHistory = Price
