import type { TelemetryStream } from './types'

// Placeholder: replace the URL with your backend telemetry endpoint
export async function fetchTelemetry(sessionId: string): Promise<TelemetryStream> {
  // For now return a small synthetic stream
  await new Promise(r => setTimeout(r, 200))
  const now = Date.now()
  return Array.from({ length: 12 }).map((_, i) => ({
    timestamp: now - (11 - i) * 1000,
    speed: 280 + i,
    rpm: 12000 + i * 200,
    gear: 6,
    throttle: 70 + i,
    brake: i % 6 === 0 ? 20 : 0,
    tireTemps: [85 + i, 84 + i, 86 + i, 83 + i],
    tirePressure: [23, 23, 22.8, 22.8],
    sector: (i % 3) + 1,
    distanceToFront: 2.5 - i * 0.05
  }))
}
