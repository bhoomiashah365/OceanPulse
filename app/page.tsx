"use client";

import { useCallback, useEffect, useState } from "react";
import ForecastCards from "./components/ForecastCards";
import WaveHeightChart from "./components/WaveHeightChart";

type ForecastPoint = {
  time: string;
  wave_height: number | null;
  wave_direction: number | null;
  sea_surface_temperature: number | null;
};

const LOCATIONS = [
  { name: "Chennai", latitude: 13.08, longitude: 80.3 },
  { name: "Visakhapatnam", latitude: 17.69, longitude: 83.22 },
  { name: "Kochi", latitude: 9.93, longitude: 76.27 },
];

export default function Home() {
  const [locationIndex, setLocationIndex] = useState(0);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = LOCATIONS[locationIndex];

  const loadForecast = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/marine?latitude=${location.latitude}&longitude=${location.longitude}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load marine forecast.");
      }

      if (!Array.isArray(data?.hourly?.time)) {
        throw new Error("Hourly forecast data is unavailable.");
      }

      const hourly = data.hourly;

      const records: ForecastPoint[] = hourly.time.map(
        (time: string, index: number) => ({
          time,
          wave_height: hourly.wave_height?.[index] ?? null,
          wave_direction: hourly.wave_direction?.[index] ?? null,
          sea_surface_temperature:
            hourly.sea_surface_temperature?.[index] ?? null,
        })
      );

      setForecast(records);
    } catch (err) {
      setForecast([]);
      setError(
        err instanceof Error ? err.message : "Unable to load forecast."
      );
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f0f7fa",
        color: "#123047",
        padding: "32px 20px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ marginBottom: 30 }}>
          <p style={{ color: "#0786a8", fontWeight: 700 }}>OCEANPULSE</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
            Ocean Conditions Explorer
          </h1>
          <p style={{ marginTop: 8 }}>
            Explore hourly marine forecasts for coastal locations.
          </p>

          <label htmlFor="location" style={{ display: "block", marginTop: 20 }}>
            Select coastal location
          </label>
          <select
            id="location"
            value={locationIndex}
            onChange={(event) => setLocationIndex(Number(event.target.value))}
            style={{ padding: 10, marginTop: 8, borderRadius: 8 }}
          >
            {LOCATIONS.map((item, index) => (
              <option key={item.name} value={index}>
                {item.name}
              </option>
            ))}
          </select>
        </header>

        <section
          style={{
            background: "#dff3f8",
            padding: 20,
            borderRadius: 14,
            marginBottom: 24,
          }}
        >
          <h2>{location.name}</h2>
          <p>
            Latitude: {location.latitude} | Longitude: {location.longitude}
          </p>
        </section>

        {loading && <p role="status">Loading marine forecast...</p>}

        {!loading && error && (
          <section role="alert" style={{ padding: 20, background: "#fff1f0" }}>
            <h2>Unable to load forecast</h2>
            <p>{error}</p>
            <button onClick={() => void loadForecast()}>Try again</button>
          </section>
        )}

        {!loading && !error && forecast.length > 0 && (
          <>
            <h2>Marine Conditions</h2>
            <ForecastCards forecast={forecast} />
            <WaveHeightChart forecast={forecast} />
          </>
        )}

        <footer style={{ marginTop: 30, fontSize: 13, color: "#526777" }}>
          Forecasts are estimates and do not replace official marine safety
          warnings.
        </footer>
      </div>
    </main>
  );
}
