export type TelemetrySample = {
  timestamp: number
  speed: number
  rpm: number
  gear: number
  throttle: number
  brake: number
  tireTemps: number[]
  tirePressure: number[]
  sector: number
  distanceToFront: number
}

export type TelemetryStream = TelemetrySample[]
