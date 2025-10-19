import React from 'react'
import ChartsPlaceholder from './ChartsPlaceholder'

export default function WheelTooltip({
  temps,
  pressures,
  wheelName,
}: {
  temps: number[]
  pressures: number[]
  wheelName: string
}) {
  return (
    <div className="w-64 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-md">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 rounded-t px-3 py-2 border-b border-slate-700 text-sm font-medium">
        {wheelName}
      </div>

      {/* Charts */}
      <div className="p-3">
        <ChartsPlaceholder title="Tire Temp" data={temps.slice(-8)} />
        <div className="h-3" />
        <ChartsPlaceholder title="Tire Pressure" data={pressures.slice(-8)} />
      </div>
    </div>
  )
}
