import React from 'react'
import ChartsPlaceholder from './ChartsPlaceholder'

export default function TelemetryPanel() {
  // Example placeholders where you will plug live backend telemetry
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartsPlaceholder title="Tire Temperature" data={[82, 85, 88, 86, 90, 92]} />
      <ChartsPlaceholder title="Speed" data={[280, 285, 290, 292, 295, 300]} />
      <ChartsPlaceholder title="RPM" data={[12000, 12500, 12800, 13000, 13200]} />
      <ChartsPlaceholder title="Gap to lead" data={[2.4, 2.2, 2.1, 1.9, 1.7]} />
    </div>
  )
}
