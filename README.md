# OceanPulse – Ocean Conditions Explorer

## About the Project

OceanPulse is a web application that makes it easier to explore ocean conditions at different coastal locations. Instead of searching through raw marine data, users can view important information such as wave height, wave direction, and sea-surface temperature in one place.

We built this project as part of the Edzul 5-Day Development Challenge, with the aim of making marine information easier to understand through a simple and interactive interface.

## What Can You Do With OceanPulse?

- **Explore ocean conditions:** View available marine forecast information for selected locations.
- **Search for places:** Find locations using the location search feature.
- **View forecast information:** Explore marine measurements and their changes over time.
- **Check coastal safety information:** Visit the coastal safety section for relevant information.
- **Explore the interface:** Use the available map, insights, and other sections to navigate the application.
- **Get feedback from the app:** Loading indicators and error messages help users understand when data is being retrieved or cannot be loaded.

## Technologies We Used

- **Next.js** – To build the web application and its pages.
- **React** – To create reusable interface components.
- **JavaScript and TypeScript** – To implement application functionality.
- **CSS** – To style the pages and make the interface easier to use.
- **Open-Meteo Marine API** – To retrieve marine forecast data.
- **Open-Meteo Geocoding API** – To search for locations.

## Running the Project Locally

Make sure Node.js and npm are installed on your computer before starting.

**1. Clone the repository**

```bash
git clone https://github.com/bhoomiashah365/OceanPulse.git
```

**2. Open the project folder**

```bash
cd OceanPulse
```

**3. Install the required packages**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the application**

Visit http://localhost:3000 in your browser.

## Where Does the Data Come From?

OceanPulse uses the Open-Meteo Marine API to retrieve marine forecast information. The current integration requests wave height, wave direction, and sea-surface temperature for a forecast period of up to three days.

The frontend requests forecast data through our `/api/marine` endpoint. We also use the Open-Meteo Geocoding API to help users find locations.

The measurements available may differ depending on the selected location and the data provided by the API.

## Testing

The project testing summary will be added after the team confirms the tests performed and their results.

## Current Limitations

- The application needs an internet connection to retrieve data from the external APIs.
- Some marine measurements may not be available for every location or time.
- Forecasts are estimates and may change as new data becomes available.
- The information displayed depends on the availability and reliability of the data provider.

## Important Safety Note

OceanPulse is intended for exploring marine conditions and should not be used as the only source for safety decisions. Before fishing, boating, or travelling at sea, check official marine forecasts and warnings issued by the relevant authorities.

## Team and Contributions

OceanPulse was developed as a team project for the Edzul 5-Day Development Challenge. Each team member contributed to different parts of the project.

Individual contributions will be added here based on the work completed by each member.

## Useful Links

- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Next.js Documentation](https://nextjs.org/docs)

