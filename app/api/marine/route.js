
import { getMarineForecast } from "../../../lib/marine";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitudeParam = searchParams.get("latitude");
    const longitudeParam = searchParams.get("longitude");

const latitude = Number(latitudeParam);
const longitude = Number(longitudeParam);

    if (
       latitudeParam === null ||
       longitudeParam === null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Response.json(
        { error: "Please provide valid latitude and longitude." },
        { status: 400 }
      );
    }

    const data = await getMarineForecast(latitude, longitude);

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Unable to fetch marine forecast data." },
      { status: 500 }
    );
  }
}
