

const MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine";

export async function getMarineForecast(latitude, longitude) {
  const url = `${MARINE_API_URL}?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_direction,sea_surface_temperature&forecast_days=3`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch marine forecast data.");
  }

  const data = await response.json();

  return data;
}
