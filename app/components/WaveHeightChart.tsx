"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type ForecastPoint = {
  time: string;
  wave_height: number | null;
  wave_direction: number | null;
  sea_surface_temperature: number | null;
};

type WaveHeightChartProps = {
  forecast: ForecastPoint[];
};

export default function WaveHeightChart({
  forecast,
}: WaveHeightChartProps) {
  const chartData = forecast
    .filter(
      (point) =>
        typeof point.wave_height === "number" &&
        Number.isFinite(point.wave_height)
    )
    .map((point) => ({
      time: point.time,
      waveHeight: point.wave_height,
    }));

  if (chartData.length === 0) {
    return (
      <section>
        <h2>Hourly Wave Height</h2>
        <p>No wave-height readings are available to plot.</p>
      </section>
    );
  }

  return (
    <section
      style={{
        background: "#ffffff",
        color: "#153047",
        border: "1px solid #dbe4ea",
        borderRadius: "14px",
        padding: "20px",
        margin: "24px 0",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>
        Hourly Wave Height
      </h2>

      <p style={{ marginBottom: "20px", color: "#526777" }}>
        Forecast wave height over time, measured in metres.
      </p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="time"
              tickFormatter={(value) =>
                value.slice(5, 16).replace("T", " ")
              }
              minTickGap={35}
            />

            <YAxis
              domain={[0, "auto"]}
              label={{
                value: "Wave height (m)",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip
              labelFormatter={(value) => `Forecast: ${value}`}
              formatter={(value) => [
                `${value} m`,
                "Wave height",
              ]}
            />

            <Line
              type="monotone"
              dataKey="waveHeight"
              name="Wave height"
              stroke="#0786a8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}