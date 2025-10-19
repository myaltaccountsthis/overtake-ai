import React, { useMemo, useState, useEffect } from "react";
import TelemetryPanel from "./components/TelemetryPanel";
import WheelTooltip from "./components/WheelTooltip";
import SuggestionPanel from "./components/SuggestionPanel";
import AudioPlayer from "./components/AudioPlayer";
import ChatBox from "./components/ChatBox";

type Tires = {
  temps: number[];
  pressure: number[];
};

export default function App() {
  // Inputs
  const [distanceToFront, setDistanceToFront] = useState<number>(2.5);
  const [speed, setSpeed] = useState<number>(300);
  const [frontSpeed, setFrontSpeed] = useState<number>(295);
  const [sector, setSector] = useState<number>(2);
  const [rpm, setRpm] = useState<number>(13000);
  const [gear, setGear] = useState<number>(6);
  const [throttle, setThrottle] = useState<number>(90);
  const [brake, setBrake] = useState<number>(20);
  const [tires, setTires] = useState<Tires>({
    temps: [85, 86, 84, 83],
    pressure: [23.0, 23.0, 22.8, 22.8],
  });
  const [trackTemp, setTrackTemp] = useState<number>(40);
  const [airTemp, setAirTemp] = useState<number>(30);
  const [lapTimeSec, setLapTimeSec] = useState<number>(109.83);
  const [remainingLaps, setRemainingLaps] = useState<number>(20);
  const [currentPosition, setCurrentPosition] = useState<number>(5);
  const [sessionId, setSessionId] = useState<string>("10033");
  const [elevenApiKey, setElevenApiKey] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("alloy");
  const lastLap = [28.432, 32.145, 29.876]; // current lap sector times
  const [flag, setFlag] = useState<string>("green"); // or yellow, red, SC, etc.
  const [trackCondition, setTrackCondition] = useState<string>("Dry"); // Wet, Damp, etc.
  const [stewardNotes, setStewardNotes] = useState<string>("No incidents");

  // Example lap data
  const laps = [
    {
      lap: 3, // most recent
      sectors: [28.432, 32.145, 29.876],
    },
    {
      lap: 2,
      sectors: [28.5, 32.2, 30.1],
    },
    {
      lap: 1,
      sectors: [28.6, 32.4, 30.3],
    },
  ];

  const personalBest = [28.432, 32.305, 29.876]; // personal best per sector
  const fastestOnTrack = [28.9, 32.0, 29.85]; // fastest sector times on track

  const avgTireTemp = useMemo(
    () => tires.temps.reduce((a, b) => a + b, 0) / tires.temps.length,
    [tires]
  );

  // Tire/pressure thresholds (tweak as needed)
  const TEMP_MIN = 70;
  const TEMP_MAX = 95;
  const PRESS_MIN = 22;
  const PRESS_MAX = 24;

  function isTireGood(temp: number, pressure: number) {
    const tGood = temp >= TEMP_MIN && temp <= TEMP_MAX;
    const pGood = pressure >= PRESS_MIN && pressure <= PRESS_MAX;
    return tGood && pGood;
  }
  //PUT GEMINI CODE HERE
  async function handleChat(message: string) {
    const m = message.toLowerCase();
    if (m.includes("tire")) {
      const avg = avgTireTemp.toFixed(1);
      const pressureAvg = (
        tires.pressure.reduce((a, b) => a + b, 0) / tires.pressure.length
      ).toFixed(2);
      return `Avg tire temp ${avg}°C · Avg pressure ${pressureAvg} psi.`;
    }
    if (m.includes("pit")) {
      return `Estimated pit: ${pitPred.readable}.`;
    }
    if (m.includes("pass") || m.includes("overtake")) {
      return `Pass in: ${passPred.readable}.`;
    }
    if (m.includes("position")) {
      return `Current: ${currentPosition}, Predicted: ${predictedPlacement}.`;
    }
    // fallback: your single recommendation string
    return rec;
  }

  function tireClass(i: number) {
    return isTireGood(tires.temps[i], tires.pressure[i])
      ? "bg-emerald-500 text-slate-900"
      : "bg-rose-600 text-white";
  }

  function boxClass(i: number) {
    return isTireGood(tires.temps[i], tires.pressure[i])
      ? "p-2 border rounded bg-slate-800 border-emerald-700 text-emerald-200"
      : "p-2 border rounded bg-slate-800 border-rose-700 text-rose-200";
  }

  function predictTimeToPass() {
    const deltaKmh = speed - frontSpeed;
    const deltaMs = deltaKmh * (1000 / 3600);
    let distMeters = distanceToFront;
    if (distanceToFront > 0 && distanceToFront <= 10) {
      distMeters = frontSpeed * (1000 / 3600) * distanceToFront;
    }
    if (deltaMs <= 0.1)
      return { seconds: Infinity, readable: "No pass expected (not faster)" };
    const seconds = distMeters / deltaMs;
    return { seconds, readable: `${seconds.toFixed(1)} s` };
  }

  function predictTimeToPit() {
    const baseStintLaps = 30;
    const tempFactor = Math.max(0.5, 1 - (avgTireTemp - 70) / 80);
    const trackFactor = Math.max(0.85, 1 - (trackTemp - 30) / 200);
    const pressureAvg =
      tires.pressure.reduce((a, b) => a + b, 0) / tires.pressure.length;
    const pressureFactor = 1 - Math.max(0, (pressureAvg - 23) / 30);
    const estimatedLapsLeft = Math.max(
      1,
      Math.round(baseStintLaps * tempFactor * trackFactor * pressureFactor)
    );
    const timeSec = estimatedLapsLeft * lapTimeSec;
    return {
      laps: estimatedLapsLeft,
      seconds: timeSec,
      readable: `${estimatedLapsLeft} laps (~${Math.round(timeSec / 60)} min)`,
    };
  }

  function predictPlacement() {
    const pass = predictTimeToPass();
    const pit = predictTimeToPit();
    let placement = currentPosition;
    const raceTimeLeftSec = remainingLaps * lapTimeSec;
    if (isFinite(pass.seconds) && pass.seconds < raceTimeLeftSec * 0.6)
      placement = Math.max(1, placement - 1);
    if (pit.laps < Math.max(3, remainingLaps / 2)) placement = placement + 1;
    return placement;
  }

  const passPred = predictTimeToPass();
  const pitPred = predictTimeToPit();
  const predictedPlacement = predictPlacement();

  function recommend() {
    const recommendations: string[] = [];
    if (avgTireTemp > 95)
      recommendations.push("Cool the tyres by backing off for 1–2 laps");
    if (passPred.seconds !== Infinity && passPred.seconds < 15)
      recommendations.push("Attempt an aggressive pass now");
    if (pitPred.laps <= 3) recommendations.push("Pit this lap for fresh tyres");
    if (throttle > 90 && avgTireTemp > 90)
      recommendations.push("Lower throttle slightly to preserve tyres");
    if (recommendations.length === 0)
      recommendations.push("Maintain pace; monitor tyre temps");
    return recommendations[0];
  }

  const rec = recommend();

  async function speak(text: string) {
    if (!elevenApiKey) {
      if ("speechSynthesis" in window) {
        const msg = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
      } else {
        alert(text);
      }
      return;
    }
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        voiceId
      )}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenApiKey,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error("TTS failed: " + resp.status);
      const blob = await resp.blob();
      const src = URL.createObjectURL(blob);
      const audio = new Audio(src);
      await audio.play();
    } catch (e) {
      console.error(e);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      }
    }
  }

  useEffect(() => {
    // placeholder for future telemetry polling
  }, []);

  return (
    <div
      className="flex flex-row-reverse gap-6 p-6 font-sans bg-slate-900 text-slate-100 min-h-screen"
      style={{ overflow: "hidden", height: "100vh" }}
    >
      <aside className="w-80 bg-slate-800 text-slate-100 p-4 rounded-lg shadow-lg border border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Sector Times</h2>

        <div className="space-y-4">
          {laps.map((lap, lapIndex) => (
            <div
              key={lap.lap}
              className="space-y-2 border-b border-slate-700 pb-2"
            >
              <h3 className="text-sm font-medium text-slate-300">
                Lap {lap.lap}
              </h3>

              {lap.sectors.map((time, i) => {
                let type = "yellow"; // default worst

                if (time <= fastestOnTrack[i]) {
                  type = "purple"; // fastest on track
                } else if (time < personalBest[i]) {
                  type = "green"; // personal best
                }

                return (
                  <div key={i} className="flex justify-between items-center">
                    <span>{`Sector ${i + 1}`}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        type === "purple"
                          ? "bg-purple-600"
                          : type === "green"
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      {time.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1">
        <div className="flex justify-center items-center gap-6 mb-4 w-full">
          <h1 className="text-2xl font-bold text-slate-100">Overtake AI</h1>

          {/* Focused Horizontal Leaderboard */}
          <div className="flex flex-wrap justify-center gap-2 text-slate-100 text-sm font-medium">
            {(() => {
              const leaderboard = [
                { pos: 1, driver: "Piastri", gap: "0.0s" },
                { pos: 2, driver: "Verstappen", gap: "1.2s" },
                { pos: 3, driver: "Leclerc", gap: "2.3s" },
                { pos: 4, driver: "Russell", gap: "3.1s" },
                { pos: 5, driver: "Norris", gap: "4.0s" },
                { pos: 6, driver: "Hamilton", gap: "5.2s" },
                { pos: 7, driver: "Alonso", gap: "6.5s" },
                { pos: 8, driver: "Sainz", gap: "7.0s" },
                { pos: 9, driver: "Stroll", gap: "7.9s" },
                { pos: 10, driver: "Albon", gap: "8.8s" },
                { pos: 11, driver: "Gasly", gap: "9.3s" },
                { pos: 12, driver: "Ocon", gap: "10.1s" },
                { pos: 13, driver: "Lawson", gap: "11.2s" },
                { pos: 14, driver: "Hadjar", gap: "12.0s" },
                { pos: 15, driver: "Doohan", gap: "13.3s" },
                { pos: 16, driver: "Bortoleto", gap: "14.0s" },
                { pos: 17, driver: "Bearman", gap: "14.8s" },
                { pos: 18, driver: "Colapinto", gap: "15.5s" },
                { pos: 19, driver: "Antonelli", gap: "16.2s" },
                { pos: 20, driver: "Hülkenberg", gap: "17.0s" },
              ];

              // Determine slice: 2 ahead, 2 behind current
              const start = Math.max(0, currentPosition - 3);
              const end = Math.min(leaderboard.length, currentPosition + 2);

              return leaderboard.slice(start, end).map((row, i, arr) => (
                <span
                  key={row.pos}
                  className={`whitespace-nowrap px-1 rounded ${
                    row.pos === currentPosition
                      ? "bg-orange-500 text-slate-900 font-bold"
                      : ""
                  }`}
                >
                  {row.pos}. {row.driver} {row.gap}
                  {i < arr.length - 1 && (
                    <span className="text-slate-400 mx-1">•</span>
                  )}
                </span>
              ));
            })()}
          </div>
        </div>

        {/* Car visualization with wheel hotspots and side panels */}
        <div className="my-6 flex gap-6 items-start">
          {/* General Info - left panel */}
          <div id="General Info" className="w-56">
            <div className="card bg-slate-800 rounded p-3 border border-slate-700">
              <label className="block text-sm font-medium text-slate-300">
                Session ID
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100 font-medium">
                  {sessionId}
                </span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Current Position
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">
                  {currentPosition}
                </span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Remaining Laps
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">
                  {remainingLaps}
                </span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Lap time (s)
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">{lapTimeSec}</span>
              </div>
            </div>
          </div>

          {/* Center: Tires visualization */}
          <div id="Tires" className="flex-none flex justify-center h-[247px]">
            <div className="relative w-[720px] max-w-2xl bg-gradient-to-b from-slate-800 pt-6 to-slate-900 p-6 rounded-lg shadow-lg border border-slate-700">
              {/* Simplified schematic: four wheels, axle, connectors, rear wing, curved front stop */}
              <svg viewBox="0 0 800 200" className="w-full h-48">
                {/* center axle rectangle */}
                <rect
                  x="200"
                  y="86"
                  width="390"
                  height="12"
                  rx="2"
                  fill="#ffffff"
                  opacity="0.06"
                />

                {/* connectors from axle to wheels */}
                <rect
                  x="183"
                  y="68"
                  width="30"
                  height="45"
                  rx="2"
                  fill="#ffffff"
                  opacity="0.04"
                />
                <rect
                  x="577"
                  y="68"
                  width="30"
                  height="45"
                  rx="2"
                  fill="#ffffff"
                  opacity="0.04"
                />
              </svg>

              <div
                className="absolute"
                style={{ left: "23%", top: "16%", zIndex: 10 }}
              >
                <div className="group relative">
                  <div
                    className={`w-12 h-12 rounded-full ${tireClass(
                      0
                    )} flex items-center justify-center shadow-lg z-20`}
                  >
                    <span className="font-semibold">FR</span>
                  </div>

                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 text-center text-xs font-medium select-none text-slate-300 z-30">
                    <div className="flex items-center gap-2">
                      {/* Temperature badge */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 14.76V3a2 2 0 10-4 0v11.76a4 4 0 104 0z"
                          />
                        </svg>
                        {tires.temps[0]}°C
                      </div>

                      {/* Pressure badge */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="12"
                            x2="16"
                            y2="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {tires.pressure[0]}
                      </div>
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute -left-72 -top-2 hidden group-hover:block z-40">
                    <WheelTooltip
                      temps={[82, 83, 84, 85, 86, 87, 88]}
                      pressures={[23, 23, 23, 23, 23, 23, 23]}
                      wheelName="Front Right"
                    />
                  </div>
                </div>
              </div>

              {/* Small speed badge — place this above the front wing arc so it sits left of the curve */}
              <div
                className="absolute flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 text-slate-100 border border-slate-700 shadow-sm"
                style={{
                  left: "8%",
                  top: "28%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* simple speed icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 12a9 9 0 1118 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                  <path
                    d="M7 13l5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="text-xs">
                  <div className="leading-none font-medium">{speed}</div>
                  <div className="leading-none text-[10px] text-slate-400">
                    km/h
                  </div>
                </div>
              </div>

              <div
                className="absolute flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 text-slate-100 border border-slate-700 shadow-sm"
                style={{
                  left: "8%",
                  top: "45%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 .97l-.02.08a2 2 0 11-3.77 0l-.02-.08a1.65 1.65 0 00-1-.97 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-.97-1l-.08-.02a2 2 0 110-3.77l.08-.02a1.65 1.65 0 00.97-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-.97l.02-.08a2 2 0 113.77 0l.02.08a1.65 1.65 0 001 .97h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 00.97 1l.08.02a2 2 0 110 3.77l-.08.02a1.65 1.65 0 00-.97 1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="text-xs">
                  <div className="leading-none font-medium">{gear}</div>
                  <div className="leading-none text-[10px] text-slate-400">
                    Gear
                  </div>
                </div>
              </div>

              <div
                className="absolute flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 text-slate-100 border border-slate-700 shadow-sm"
                style={{
                  left: "8%",
                  top: "62%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* simple rpm icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  <path
                    d="M12 12 L12 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12 L16 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="text-xs">
                  <div className="leading-none font-medium">{rpm}</div>
                  <div className="leading-none text-[10px] text-slate-400">
                    rpm
                  </div>
                </div>
              </div>

              {/* front wing arc: positioned left of the front wheels (nose arc) rotated 90deg left */}
              <div
                className="absolute"
                style={{
                  left: "16%",
                  top: "32%",
                  transform: "translateX(-50%) rotate(-90deg)",
                  transformOrigin: "center",
                }}
              >
                <svg
                  width="220"
                  height="80"
                  viewBox="0 0 220 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M40 70 Q110 10 180 70"
                    stroke="#ffffffff"
                    strokeWidth="10"
                    strokeLinecap="round"
                    opacity="0.06"
                    fill="none"
                  />
                </svg>
              </div>

              <div className="absolute" style={{ left: "69%", top: "16%" }}>
                <div className="group relative">
                  <div
                    className={`w-12 h-12 rounded-full ${tireClass(
                      1
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <span className="font-semibold">RR</span>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 text-center text-xs font-medium select-none text-slate-300">
                    <div className="flex items-center gap-2">
                      {/* Temperature badge with icon */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        {/* Thermometer icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 14.76V3a2 2 0 10-4 0v11.76a4 4 0 104 0z"
                          />
                        </svg>
                        {tires.temps[1]}°C
                      </div>

                      {/* Pressure badge with icon */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        {/* Pressure icon (gauge) */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          {/* Circular gauge with needle */}
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="12"
                            x2="16"
                            y2="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {tires.pressure[1]}
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-20 -top-2 hidden group-hover:block">
                    <WheelTooltip
                      temps={[81, 82, 83, 84, 85, 86, 86]}
                      pressures={[22.8, 22.9, 23, 23, 23, 23, 23]}
                      wheelName="Rear Right"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ left: "23%", top: "56%" }}>
                <div className="group relative">
                  <div
                    className={`w-12 h-12 rounded-full ${tireClass(
                      2
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <span className="font-semibold">FL</span>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 text-center text-xs font-medium select-none text-slate-300">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center gap-2">
                        {/* Temperature badge with icon */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                          {/* Thermometer icon */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 14.76V3a2 2 0 10-4 0v11.76a4 4 0 104 0z"
                            />
                          </svg>
                          {tires.temps[2]}°C
                        </div>

                        {/* Pressure badge with icon */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                          {/* Pressure icon (gauge) */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            {/* Circular gauge with needle */}
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <line
                              x1="12"
                              y1="12"
                              x2="16"
                              y2="8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {tires.pressure[2]}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -left-72 top-0 hidden group-hover:block">
                    <WheelTooltip
                      temps={[84, 85, 86, 87, 88, 89, 90]}
                      pressures={[23.2, 23.2, 23.1, 23.0, 23.0, 23.0, 23.0]}
                      wheelName="Front Left"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ left: "69%", top: "56%" }}>
                <div className="group relative">
                  <div
                    className={`w-12 h-12 rounded-full ${tireClass(
                      3
                    )} flex items-center justify-center shadow-lg`}
                  >
                    <span className="font-semibold">RL</span>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-1 text-center text-xs font-medium select-none text-slate-300">
                    <div className="flex items-center gap-2">
                      {/* Temperature badge with icon */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        {/* Thermometer icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 14.76V3a2 2 0 10-4 0v11.76a4 4 0 104 0z"
                          />
                        </svg>
                        {tires.temps[3]}°C
                      </div>

                      {/* Pressure badge with icon */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[#a78bfa] text-[10px] font-medium shadow-sm">
                        {/* Pressure icon (gauge) */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          {/* Circular gauge with needle */}
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="12"
                            y1="12"
                            x2="16"
                            y2="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {tires.pressure[3]}
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-20 top-0 hidden group-hover:block">
                    <WheelTooltip
                      temps={[83, 84, 85, 86, 87, 88, 89]}
                      pressures={[22.9, 23.0, 23.0, 23.0, 23.0, 23.0, 23.0]}
                      wheelName="Rear Left"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ left: "78%", top: "20%" }}>
                <div className="w-4 h-32 bg-white rounded opacity-10" />
              </div>
            </div>
          </div>

          {/* Comp Info - right panel */}
          <div id="Comp Info" className="w-60">
            <div className="card bg-slate-800 rounded p-3 border border-slate-700">
              <label className="block text-sm font-medium text-slate-300">
                Distance to Car in Front
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">
                  {distanceToFront} m
                </span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Your Speed
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">{speed} km/h</span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Front Car Speed
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">
                  {frontSpeed} km/h
                </span>
              </div>

              <label className="block text-sm font-medium mt-2 text-slate-300">
                Sector
              </label>
              <div className="mt-1">
                <span className="select-none text-slate-100">{sector}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="flex gap-6 mt-4">
          {/* Suggestion Panel */}
          <SuggestionPanel
            suggestions={{
              speed: "+5 km/h",
              tirePressure: "+3",
              fuelLevel: "Refill",
            }}
          />

          {/* Pedals + AudioPlayer container */}
          <div className="flex gap-4">
            {/* Pedals */}
            <div className="card w-48 bg-slate-800 border border-slate-700 rounded p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Pedals
              </h3>

              <div className="flex gap-4 justify-center">
                {/* Throttle */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-slate-300 mb-1">Throttle</div>
                  <div className="w-6 h-32 bg-slate-700 rounded overflow-hidden relative">
                    <div
                      className={`absolute bottom-0 w-full rounded transition-all duration-200 ${
                        throttle <= 50
                          ? "bg-green-500"
                          : throttle <= 80
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ height: `${throttle}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">{throttle}%</div>
                </div>

                {/* Brake */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-slate-300 mb-1">Brake</div>
                  <div className="w-6 h-32 bg-slate-700 rounded overflow-hidden relative">
                    <div
                      className={`absolute bottom-0 w-full rounded transition-all duration-200 ${
                        brake <= 50
                          ? "bg-green-500"
                          : brake <= 80
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ height: `${brake}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">{brake}%</div>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            {/* Audio Player */}
            <div className="card w-48 bg-slate-800 border border-slate-700 rounded p-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6v12h4l5-6-5-6H4z"
                  />
                </svg>
                Audio
              </h3>

              {/* Vertical Buttons */}
              <div className="flex flex-col gap-2 w-full items-center">
                <button className="w-24 px-3 py-1 rounded bg-green-500 text-slate-900 font-medium hover:bg-green-600 transition">
                  Play
                </button>
                <button className="w-24 px-3 py-1 rounded bg-yellow-400 text-slate-900 font-medium hover:bg-yellow-500 transition">
                  Mute
                </button>
                <button className="w-24 px-3 py-1 rounded bg-red-500 text-slate-100 font-medium hover:bg-red-600 transition">
                  Stop
                </button>
              </div>
            </div>
            <ChatBox onSend={handleChat} />
          </div>
        </section>
        <section className="flex gap-6 mt-4 w-full">
          {/* Flag / Track Status */}
          <div className="card flex-1 bg-slate-800 border border-slate-700 rounded p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Track Status
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full ${
                  flag === "green"
                    ? "bg-green-500"
                    : flag === "yellow"
                    ? "bg-yellow-400"
                    : flag === "red"
                    ? "bg-red-600"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-slate-100 font-medium">
                {flag ? flag.toUpperCase() : "No flag"}
              </span>
            </div>
            <div className="mt-2 text-slate-300 text-sm">
              Track Condition: {trackCondition || "Dry"}
            </div>
          </div>

          {/* Steward Notes */}
          <div className="card flex-1 bg-slate-800 border border-slate-700 rounded p-4" >
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Steward Notes
            </h3>
            <div className="text-slate-300 text-sm">
              {stewardNotes || "No recent steward messages."}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
