type ForecastPoint = {
  time: string;
  wave_height: number | null;
  wave_direction: number | null;
  sea_surface_temperature: number | null;
};

type ForecastCardsProps = {
  forecast: ForecastPoint[];
};

function formatValue(value: number | null, unit: string) {
  return value === null || !Number.isFinite(value)
    ? "Unavailable"
    : `${value.toFixed(1)} ${unit}`;
}

function getDirection(degrees: number | null) {
  if (degrees === null || !Number.isFinite(degrees)) {
    return "Unavailable";
  }

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;

  return `${directions[index]} (${degrees}°)`;
}

function firstAvailable(
  forecast: ForecastPoint[],
  key: keyof ForecastPoint
) {
  return forecast.find(
    (point) =>
      typeof point[key] === "number" &&
      Number.isFinite(point[key])
  );
}

export default function ForecastCards({
  forecast,
}: ForecastCardsProps) {
  const wave = firstAvailable(forecast, "wave_height");
  const direction = firstAvailable(forecast, "wave_direction");
  const temperature = firstAvailable(
    forecast,
    "sea_surface_temperature"
  );

  const cards = [
    {
      title: "Wave Height",
      value: formatValue(wave?.wave_height ?? null, "m"),
      time: wave?.time,
      icon: "Wave",
    },
    {
      title: "Wave Direction",
      value: getDirection(direction?.wave_direction ?? null),
      time: direction?.time,
      icon: "Compass",
    },
    {
      title: "Sea-Surface Temperature",
      value: formatValue(
        temperature?.sea_surface_temperature ?? null,
        "°C"
      ),
      time: temperature?.time,
      icon: "Temp",
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        margin: "24px 0",
      }}
    >
      {cards.map((card) => (
        <article
          key={card.title}
          style={{
            padding: "20px",
            border: "1px solid #dbe4ea",
            borderRadius: "14px",
            background: "#ffffff",
            color: "#153047",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700 }}>
            {card.icon}
          </div>
          <h3 style={{ margin: "12px 0 8px" }}>{card.title}</h3>
          <p style={{ fontSize: "23px", fontWeight: 700 }}>
            {card.value}
          </p>
          <small>
            {card.time
              ? `Forecast time: ${card.time.replace("T", " ")}`
              : "No reading available"}
          </small>
        </article>
      ))}
    </section>
  );
}
