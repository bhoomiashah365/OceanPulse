"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import styles from "./page.module.css";

export type OceanPulseView = "home" | "live" | "forecast" | "map" | "insights" | "safety" | "about";

const navigation: { href: string; label: string; view: OceanPulseView }[] = [
  { href: "/", label: "Home", view: "home" },
  { href: "/live-conditions", label: "Live conditions", view: "live" },
  { href: "/forecast", label: "Forecast", view: "forecast" },
  { href: "/map", label: "Explore map", view: "map" },
  { href: "/insights", label: "Insights", view: "insights" },
  { href: "/coastal-safety", label: "Coastal safety", view: "safety" },
  { href: "/about", label: "About", view: "about" },
];

type Location = {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
};

type MarineForecast = {
  hourly?: {
    time?: string[];
    wave_height?: Array<number | null>;
    wave_direction?: Array<number | null>;
    sea_surface_temperature?: Array<number | null>;
  };
  hourly_units?: {
    wave_height?: string;
    wave_direction?: string;
    sea_surface_temperature?: string;
  };
};

type MapCoordinates = { lat: number; lng: number };
type MapTile = { key: string; src: string; left: number; top: number };
type MapDrag = { pointerId: number; startX: number; startY: number; center: MapCoordinates; moved: boolean };

const mapTileSize = 256;

function mapCoordinatesToPixels(coordinates: MapCoordinates, zoom: number) {
  const worldSize = mapTileSize * 2 ** zoom;
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, coordinates.lat));
  const latitudeRadians = latitude * Math.PI / 180;
  return {
    x: ((coordinates.lng + 180) / 360) * worldSize,
    y: ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * worldSize,
  };
}

function mapPixelsToCoordinates(x: number, y: number, zoom: number): MapCoordinates {
  const worldSize = mapTileSize * 2 ** zoom;
  const wrappedX = ((x % worldSize) + worldSize) % worldSize;
  const boundedY = Math.max(0, Math.min(worldSize, y));
  return {
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * boundedY / worldSize))) * 180 / Math.PI,
    lng: wrappedX / worldSize * 360 - 180,
  };
}

function getMapTiles(center: MapCoordinates, zoom: number, width: number, height: number): MapTile[] {
  const centerPixel = mapCoordinatesToPixels(center, zoom);
  const tileCount = 2 ** zoom;
  const firstTileX = Math.floor((centerPixel.x - width / 2) / mapTileSize);
  const lastTileX = Math.floor((centerPixel.x + width / 2) / mapTileSize);
  const firstTileY = Math.floor((centerPixel.y - height / 2) / mapTileSize);
  const lastTileY = Math.floor((centerPixel.y + height / 2) / mapTileSize);
  const tiles: MapTile[] = [];

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue;
    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
        left: tileX * mapTileSize - centerPixel.x + width / 2,
        top: tileY * mapTileSize - centerPixel.y + height / 2,
      });
    }
  }

  return tiles;
}

const locations: Location[] = [
  { name: "Chennai", region: "Tamil Nadu, India", latitude: 13.0827, longitude: 80.2707 },
  { name: "Mumbai", region: "Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { name: "Goa", region: "Goa, India", latitude: 15.4909, longitude: 73.8278 },
  { name: "Kochi", region: "Kerala, India", latitude: 9.9312, longitude: 76.2673 },
  { name: "Visakhapatnam", region: "Andhra Pradesh, India", latitude: 17.6868, longitude: 83.2185 },
  { name: "Puri", region: "Odisha, India", latitude: 19.8135, longitude: 85.8312 },
  { name: "Port Blair", region: "Andaman and Nicobar Islands, India", latitude: 11.6234, longitude: 92.7265 },
  { name: "Monterey", region: "California, USA", latitude: 36.6002, longitude: -121.8947 },
  { name: "Santa Cruz", region: "California, USA", latitude: 36.9741, longitude: -122.0308 },
  { name: "San Diego", region: "California, USA", latitude: 32.7157, longitude: -117.1611 },
  { name: "Kailua-Kona", region: "Hawaii, USA", latitude: 19.639, longitude: -155.9969 },
  { name: "Sydney", region: "New South Wales, Australia", latitude: -33.8688, longitude: 151.2093 },
];
const emptyTimes: string[] = [];

function forecastDate(value: string) {
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    timeZone: "UTC",
  }).format(forecastDate(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(forecastDate(value));
}

function formatMeasurement(value: number | null | undefined, unit: string, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)} ${unit}`;
}

function compassDirection(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return directions[Math.round(value / 22.5) % directions.length];
}

function seaState(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Awaiting data";
  if (value < 0.5) return "Calm waters";
  if (value < 1.5) return "Gentle swell";
  if (value < 2.5) return "Moderate swell";
  return "High surf";
}

type GeocodingResponse = {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
  }>;
};

function LocationSearch({
  location,
  onSelect,
}: {
  location: Location;
  onSelect: (location: Location) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-locations`;

  useEffect(() => {
    const search = query.trim();
    if (search.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          name: search,
          count: "8",
          language: "en",
          format: "json",
        });
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Location search request failed");

        const data: GeocodingResponse = await response.json();
        const locations = (data.results ?? [])
          .filter((result) =>
            Number.isFinite(result.latitude) &&
            Number.isFinite(result.longitude) &&
            result.latitude >= -90 &&
            result.latitude <= 90 &&
            result.longitude >= -180 &&
            result.longitude <= 180,
          )
          .map((result) => ({
            name: result.name,
            region: [result.admin1, result.country].filter(Boolean).join(", "),
            latitude: result.latitude,
            longitude: result.longitude,
          }));
        setResults(locations);
        setStatus("ready");
        setActiveIndex(-1);
      } catch {
        if (controller.signal.aborted) return;
        setStatus("error");
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const selectResult = (result: Location) => {
    onSelect(result);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    } else if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  return (
    <div
      className={styles.locationField}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
    >
      <span className={styles.locationIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M19 10.2c0 5-7 10.3-7 10.3S5 15.2 5 10.2a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.3" /></svg>
      </span>
      <span className={styles.locationText}>
        <label className={styles.locationLabel} htmlFor={`${id}-search`}>COASTAL LOCATION</label>
        <input
          ref={inputRef}
          id={`${id}-search`}
          type="search"
          role="combobox"
          autoComplete="off"
          placeholder="Search a city or coastal place"
          value={isOpen ? query : `${location.name}${location.region ? `, ${location.region}` : ""}`}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          onFocus={() => {
            setQuery("");
            setResults([]);
            setStatus("idle");
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setResults([]);
            setStatus(nextQuery.trim().length >= 2 ? "loading" : "idle");
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {isOpen && (
          <div className={styles.locationSuggestions} id={listboxId} role="listbox" aria-label="Location search results">
            {status === "loading" && <span className={styles.locationSearchMessage} role="status">Searching locations…</span>}
            {status === "error" && <span className={styles.locationSearchMessage} role="status">Couldn’t search locations. Check your connection and try again.</span>}
            {status === "ready" && results.length === 0 && (
              <span className={styles.locationSearchMessage} role="status">No matching locations found.</span>
            )}
            {status === "idle" && <span className={styles.locationSearchMessage}>Type at least 2 characters to search locations worldwide.</span>}
            {results.map((result, index) => (
              <button
                className={activeIndex === index ? styles.locationSuggestionActive : styles.locationSuggestion}
                id={`${listboxId}-${index}`}
                key={`${result.name}-${result.region}-${result.latitude}-${result.longitude}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectResult(result)}
              >
                <strong>{result.name}</strong>
                <span>{result.region || `${result.latitude.toFixed(3)}°, ${result.longitude.toFixed(3)}°`}</span>
              </button>
            ))}
          </div>
        )}
      </span>
      <span className={styles.selectChevron} aria-hidden="true">⌄</span>
    </div>
  );
}

export function OceanPulse({ view }: { view: OceanPulseView }) {
  const isHome = view === "home";
  const needsForecast = !["safety", "about"].includes(view);
  const needsMap = isHome || view === "map";
  const [location, setLocation] = useState(locations[0]);
  const [forecast, setForecast] = useState<MarineForecast | null>(null);
  const [loading, setLoading] = useState(needsForecast);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [forecastTimestamp, setForecastTimestamp] = useState<number | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapCenter, setMapCenter] = useState<MapCoordinates>({
    lat: locations[0].latitude,
    lng: locations[0].longitude,
  });
  const [mapZoom, setMapZoom] = useState(5);
  const [mapSize, setMapSize] = useState({ width: 800, height: 380 });
  const [activeOrbit, setActiveOrbit] = useState<"outer" | "inner" | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(null);
  const [oceanVideoFailed, setOceanVideoFailed] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapDragRef = useRef<MapDrag | null>(null);
  const oceanVideoRef = useRef<HTMLVideoElement>(null);
  const mapTiles = useMemo(
    () => getMapTiles(mapCenter, mapZoom, mapSize.width, mapSize.height),
    [mapCenter, mapSize, mapZoom],
  );
  const mapMarkerPixel = mapCoordinatesToPixels(
    { lat: location.latitude, lng: location.longitude },
    mapZoom,
  );
  const mapCenterPixel = mapCoordinatesToPixels(mapCenter, mapZoom);
  const mapMarkerStyle = {
    left: `${mapSize.width / 2 + mapMarkerPixel.x - mapCenterPixel.x}px`,
    top: `${mapSize.height / 2 + mapMarkerPixel.y - mapCenterPixel.y}px`,
  };

  useEffect(() => {
    if (!isHome) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlayback = () => {
      setPrefersReducedMotion(motionPreference.matches);
      const video = oceanVideoRef.current;
      if (!video) return;
      if (motionPreference.matches) {
        video.pause();
      } else {
        void video.play().catch(() => setOceanVideoFailed(true));
      }
    };

    updatePlayback();
    motionPreference.addEventListener("change", updatePlayback);
    return () => motionPreference.removeEventListener("change", updatePlayback);
  }, [isHome]);

  useEffect(() => {
    if (!needsForecast) return;
    const controller = new AbortController();

    async function loadForecast() {
      setLoading(true);
      setError(false);
      setForecast(null);
      setForecastTimestamp(null);

      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
        });
        const response = await fetch(`/api/marine?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Forecast request failed");
        const data: MarineForecast = await response.json();
        setForecast(data);
        setForecastTimestamp(Date.now());
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadForecast();
    return () => controller.abort();
  }, [location, needsForecast, retryCount]);

  useEffect(() => {
    if (!needsMap || !mapElementRef.current) return;
    const element = mapElementRef.current;
    const updateSize = () => {
      setMapSize({ width: element.clientWidth, height: element.clientHeight });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [needsMap]);

  const selectLocation = (nextLocation: Location) => {
    setLocation(nextLocation);
    setMapCenter({ lat: nextLocation.latitude, lng: nextLocation.longitude });
  };

  const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    mapDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      center: mapCenter,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) drag.moved = true;
    if (!drag.moved) return;
    const centerPixel = mapCoordinatesToPixels(drag.center, mapZoom);
    setMapCenter(mapPixelsToCoordinates(centerPixel.x - deltaX, centerPixel.y - deltaY, mapZoom));
  };

  const handleMapPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && mapElementRef.current) {
      const bounds = mapElementRef.current.getBoundingClientRect();
      const centerPixel = mapCoordinatesToPixels(drag.center, mapZoom);
      const coordinates = mapPixelsToCoordinates(
        centerPixel.x + event.clientX - bounds.left - bounds.width / 2,
        centerPixel.y + event.clientY - bounds.top - bounds.height / 2,
        mapZoom,
      );
      setLocation({
        name: "Map selection",
        region: `${coordinates.lat.toFixed(3)}°, ${coordinates.lng.toFixed(3)}°`,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
      setMapCenter(coordinates);
    }
    mapDragRef.current = null;
  };

  const times = forecast?.hourly?.time ?? emptyTimes;
  const currentIndex = useMemo(() => {
    const nextIndex = times.findIndex((time) => forecastDate(time).getTime() >= (forecastTimestamp ?? 0));
    return times.length === 0 ? -1 : Math.max(0, nextIndex);
  }, [times, forecastTimestamp]);

  const chartPoints = useMemo(() => {
    const values = forecast?.hourly?.wave_height ?? [];
    return times.slice(currentIndex < 0 ? 0 : currentIndex, (currentIndex < 0 ? 0 : currentIndex) + 12)
      .map((time, index) => ({
        time,
        value: values[(currentIndex < 0 ? 0 : currentIndex) + index],
      }))
      .filter((point): point is { time: string; value: number } =>
        typeof point.value === "number" && Number.isFinite(point.value),
      );
  }, [forecast, currentIndex, times]);

  const waveHeights = forecast?.hourly?.wave_height ?? [];
  const waveDirections = forecast?.hourly?.wave_direction ?? [];
  const temperatures = forecast?.hourly?.sea_surface_temperature ?? [];
  const currentTime = currentIndex >= 0 ? times[currentIndex] : undefined;
  const currentWave = currentIndex >= 0 ? waveHeights[currentIndex] : undefined;
  const maxWave = Math.max(0.5, ...chartPoints.map((point) => point.value));
  const plottedPoints = chartPoints.map((point, index) => ({
    ...point,
    x: chartPoints.length === 1 ? 400 : (index / (chartPoints.length - 1)) * 800,
    y: 188 - (point.value / maxWave) * 142,
  }));
  const chartLine = plottedPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const chartArea = plottedPoints.length > 0
    ? `${chartLine} L ${plottedPoints[plottedPoints.length - 1].x} 200 L ${plottedPoints[0].x} 200 Z`
    : "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="OceanPulse home">
          <Image className={styles.brandLogo} src="/oceanpulse-logo-clean.png" alt="" width={735} height={455} priority />
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.view}
              className={view === item.view ? styles.navLinkActive : styles.navLink}
              href={item.href}
              aria-current={view === item.view ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main id="top" className={styles.main}>
        {!isHome && (
          <section className={styles.pageIntro}>
            <p className={styles.sectionEyebrow}>OCEANPULSE · {view === "live" ? "CURRENT CONDITIONS" : view.toUpperCase()}</p>
            <h1>
              {view === "live" ? "Live conditions" : view === "forecast" ? "Forecast details" : view === "map" ? "Explore the map" : view === "insights" ? "Ocean insights" : view === "safety" ? "Coastal safety" : "About OceanPulse"}
            </h1>
            <p>
              {view === "live" ? "A focused view of the latest available marine readings for your selected coast." :
                view === "forecast" ? "Explore the available hourly wave outlook and forecast context." :
                  view === "map" ? "Choose a coastal location or select a point on the map to update the forecast." :
                    view === "insights" ? "Understand the wave conditions and short-range patterns available in this forecast." :
                      view === "safety" ? "Use marine information thoughtfully and take care around changing coastal conditions." :
                        "A clearer view of ocean conditions, with transparent data sources and limitations."}
            </p>
            {!["safety", "about"].includes(view) && (
              <LocationSearch location={location} onSelect={selectLocation} />
            )}
          </section>
        )}
        {isHome && (
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span /> THE OCEAN, IN FOCUS</p>
              <h1>Explore<br />the Blue<span>.</span></h1>
              <p className={styles.heroText}>A clearer view of the water ahead. Explore marine conditions and the rhythm of the coast.</p>
              <LocationSearch location={location} onSelect={selectLocation} />
            </div>

            <div className={styles.heroVisual} aria-label="Current ocean conditions">
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleOne}`} aria-hidden="true" />
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleTwo}`} aria-hidden="true" />
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleThree}`} aria-hidden="true" />
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleFour}`} aria-hidden="true" />
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleFive}`} aria-hidden="true" />
              <span className={`${styles.decorativeCircle} ${styles.decorativeCircleSix}`} aria-hidden="true" />
              <svg
                role="button"
                tabIndex={0}
                viewBox="0 0 100 100"
                className={`${styles.orbit} ${styles.orbitOne} ${activeOrbit === "outer" ? styles.orbitActive : ""}`}
                aria-label="Highlight current wave height and location"
                aria-pressed={activeOrbit === "outer"}
                onClick={() => setActiveOrbit((current) => current === "outer" ? null : "outer")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveOrbit((current) => current === "outer" ? null : "outer");
                  }
                }}
              >
                {activeOrbit === "outer" && <circle className={styles.orbitPulse} cx="50" cy="50" r="48.8" />}
                <circle className={styles.orbitStroke} cx="50" cy="50" r="48.8" />
              </svg>
              <svg
                role="button"
                tabIndex={0}
                viewBox="0 0 100 100"
                className={`${styles.orbit} ${styles.orbitTwo} ${activeOrbit === "inner" ? styles.orbitActive : ""}`}
                aria-label="Highlight current ocean reading"
                aria-pressed={activeOrbit === "inner"}
                onClick={() => setActiveOrbit((current) => current === "inner" ? null : "inner")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveOrbit((current) => current === "inner" ? null : "inner");
                  }
                }}
              >
                {activeOrbit === "inner" && <circle className={styles.orbitPulse} cx="50" cy="50" r="48.8" />}
                <circle className={styles.orbitStroke} cx="50" cy="50" r="48.8" />
              </svg>
              <div className={styles.heroData}>
                <span className={styles.heroDataLabel}>CURRENT WAVE HEIGHT</span>
                {loading ? <span className={`${styles.heroValue} ${styles.skeletonText}`} /> : (
                  <strong className={styles.heroValue}>
                    {formatMeasurement(currentWave, forecast?.hourly_units?.wave_height ?? "m")}
                  </strong>
                )}
                <span className={styles.heroSeaState}>{loading ? "Reading the swell..." : seaState(currentWave)}</span>
                <span className={styles.heroDivider} />
                <span className={styles.heroDataLabel}>{location.name.toUpperCase()} · {location.region.toUpperCase()}</span>
                {currentTime && <span className={styles.heroTimestamp}>{formatDate(currentTime)} · {formatHour(currentTime)} UTC</span>}
              </div>
            </div>
          </div>
          <div className={styles.waveGraphic} aria-hidden="true">
            {prefersReducedMotion === true || oceanVideoFailed ? (
              <Image
                className={styles.oceanVideo}
                src="/ocean-waves-pexels-9620654-poster.jpg"
                alt=""
                fill
                sizes="100vw"
                priority
              />
            ) : (
              <video
                ref={oceanVideoRef}
                className={styles.oceanVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/ocean-waves-pexels-9620654-poster.jpg"
                onError={() => setOceanVideoFailed(true)}
              >
                <source src="/ocean-waves-pexels-9620654.mp4" type="video/mp4" />
              </video>
            )}
          </div>
          <div className={styles.heroFooter}><span>MARINE CONDITIONS</span><span>01 / COASTAL OUTLOOK</span></div>
        </section>
        )}

        {(isHome || view === "map") && <section className={styles.mapSection} id="coastal-map">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>CHOOSE YOUR COAST</p>
              <h2>Explore the ocean map</h2>
            </div>
            <p className={styles.mapHint}>Select any point on the map to update the forecast.</p>
          </div>
          <div className={styles.mapFrame}>
            <div
              className={styles.mapCanvas}
              ref={mapElementRef}
              role="application"
              tabIndex={0}
              aria-label="Interactive OpenStreetMap. Click to choose forecast coordinates, drag to pan, use plus and minus to zoom."
              onPointerDown={handleMapPointerDown}
              onPointerMove={handleMapPointerMove}
              onPointerUp={handleMapPointerUp}
              onPointerCancel={() => { mapDragRef.current = null; }}
              onWheel={(event) => {
                event.preventDefault();
                setMapZoom((zoom) => Math.max(2, Math.min(17, zoom + (event.deltaY < 0 ? 1 : -1))));
              }}
              onKeyDown={(event) => {
                if (event.key === "+" || event.key === "=") setMapZoom((zoom) => Math.min(17, zoom + 1));
                if (event.key === "-") setMapZoom((zoom) => Math.max(2, zoom - 1));
                if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                  event.preventDefault();
                  const centerPixel = mapCoordinatesToPixels(mapCenter, mapZoom);
                  const offset = 96;
                  const deltaX = event.key === "ArrowLeft" ? -offset : event.key === "ArrowRight" ? offset : 0;
                  const deltaY = event.key === "ArrowUp" ? -offset : event.key === "ArrowDown" ? offset : 0;
                  setMapCenter(mapPixelsToCoordinates(centerPixel.x + deltaX, centerPixel.y + deltaY, mapZoom));
                }
              }}
            >
              <div className={styles.mapTiles} aria-hidden="true">
                {mapTiles.map((tile) => (
                  <Image
                    key={tile.key}
                    className={styles.mapTile}
                    width={mapTileSize}
                    height={mapTileSize}
                    src={tile.src}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    unoptimized
                    style={{ left: tile.left, top: tile.top }}
                    onLoad={() => setMapStatus("ready")}
                    onError={() => setMapStatus((status) => status === "ready" ? status : "error")}
                  />
                ))}
              </div>
              <span className={styles.mapMarker} style={mapMarkerStyle} aria-hidden="true"><span /></span>
            </div>
            <div className={styles.mapZoomControls} aria-label="Map zoom controls">
              <button type="button" aria-label="Zoom in" onClick={() => setMapZoom((zoom) => Math.min(17, zoom + 1))}>+</button>
              <button type="button" aria-label="Zoom out" onClick={() => setMapZoom((zoom) => Math.max(2, zoom - 1))}>−</button>
            </div>
            <a className={styles.mapAttribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
            {mapStatus !== "ready" && (
              <div className={styles.mapNotice} role="status">
                <span className={styles.mapNoticeIcon} aria-hidden="true">⌖</span>
                <strong>{mapStatus === "loading" ? "Loading OpenStreetMap" : "Map tiles could not be loaded"}</strong>
                <span>
                  {mapStatus === "loading"
                    ? "The map is loading. You can still choose a coastal location above."
                    : "Check your internet connection. Forecasts are still available from the location selector."}
                </span>
              </div>
            )}
            <div className={styles.mapCoordinates}>
              <span className={styles.mapLiveDot} />
              {location.latitude.toFixed(3)}° · {location.longitude.toFixed(3)}°
            </div>
          </div>
        </section>}

        {(isHome || view === "live") && <section className={styles.dashboard} id="conditions">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>AT A GLANCE</p>
              <h2>Ocean conditions</h2>
            </div>
            <p className={styles.updatedAt}>
              {loading ? "Updating forecast" : currentTime ? `Forecast time · ${formatDate(currentTime)} · UTC` : "Forecast conditions"}
            </p>
          </div>

          {error ? (
            <div className={styles.messageState} role="alert">
              <span className={styles.messageIcon} aria-hidden="true">!</span>
              <div><strong>We couldn’t reach the forecast.</strong><p>Check your connection and try again.</p></div>
              <button className={styles.retryButton} onClick={() => setRetryCount((count) => count + 1)}>Retry forecast</button>
            </div>
          ) : (
            <div className={`${styles.conditionsGrid} ${view === "live" ? styles.expandedConditions : ""}`}>
              <article className={`${styles.conditionCard} ${styles.primaryCard}`}>
                <div className={styles.cardTopline}><span>WAVE HEIGHT</span><span className={styles.cardIcon} aria-hidden="true">↗</span></div>
                {loading ? <span className={`${styles.cardValue} ${styles.skeletonText}`} /> : <strong className={styles.cardValue}>{formatMeasurement(currentWave, forecast?.hourly_units?.wave_height ?? "m")}</strong>}
                <p>{loading ? "Loading current reading" : seaState(currentWave)}</p>
                <div className={styles.cardAccent}><span /></div>
              </article>
              <article className={styles.conditionCard}>
                <div className={styles.cardTopline}><span>WAVE DIRECTION</span><span className={`${styles.cardIcon} ${styles.directionIcon}`} aria-hidden="true">↗</span></div>
                {loading ? <span className={`${styles.cardValue} ${styles.skeletonText}`} /> : <strong className={styles.cardValue}>{compassDirection(waveDirections[currentIndex])}</strong>}
                <p>{loading ? "Loading current reading" : `${formatMeasurement(waveDirections[currentIndex], forecast?.hourly_units?.wave_direction ?? "°", 0)} compass bearing`}</p>
              </article>
              <article className={styles.conditionCard}>
                <div className={styles.cardTopline}><span>SEA TEMPERATURE</span><span className={`${styles.cardIcon} ${styles.temperatureIcon}`} aria-hidden="true">°</span></div>
                {loading ? <span className={`${styles.cardValue} ${styles.skeletonText}`} /> : <strong className={styles.cardValue}>{formatMeasurement(temperatures[currentIndex], forecast?.hourly_units?.sea_surface_temperature ?? "°C")}</strong>}
                <p>{loading ? "Loading current reading" : "Sea-surface temperature"}</p>
              </article>
              {view === "live" && (
                <article className={styles.conditionCard}>
                  <div className={styles.cardTopline}><span>WIND</span><span className={styles.cardIcon} aria-hidden="true">—</span></div>
                  <strong className={styles.cardValue}>Not available</strong>
                  <p>Wind speed and direction are not in this data feed.</p>
                </article>
              )}
            </div>
          )}
        </section>}

        {(isHome || view === "forecast") && <section className={styles.forecastSection} id="forecast">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>NEXT 12 HOURS</p>
              <h2>Hourly wave forecast</h2>
            </div>
            <span className={styles.chartUnit}>Wave height · {forecast?.hourly_units?.wave_height ?? "m"}</span>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div><span className={styles.chartLegend} /><span>Wave height</span></div>
              <span>Times shown in UTC</span>
            </div>
            {loading ? (
              <div className={styles.chartSkeleton} aria-label="Loading hourly forecast"><span /><span /><span /><span /><span /><span /><span /></div>
            ) : error ? (
              <div className={styles.chartEmpty}>Hourly conditions will appear when the forecast is available.</div>
            ) : chartPoints.length === 0 ? (
              <div className={styles.chartEmpty}>No hourly wave data is available for this location.</div>
            ) : (
              <>
                <div className={styles.chartPlot}>
                  <div className={styles.chartScale} aria-hidden="true"><span>{maxWave.toFixed(1)}</span><span>{(maxWave / 2).toFixed(1)}</span><span>0</span></div>
                  <svg className={styles.chartSvg} viewBox="0 0 800 210" preserveAspectRatio="none" role="img" aria-label={`Wave height forecast for ${location.name}`}>
                    <defs><linearGradient id="wave-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#36D9F5" stopOpacity="0.23" /><stop offset="100%" stopColor="#36D9F5" stopOpacity="0" /></linearGradient></defs>
                    <path className={styles.gridLine} d="M0 46H800M0 117H800M0 188H800" />
                    {chartArea && <path className={styles.chartArea} d={chartArea} />}
                    {plottedPoints.length > 1 && <path className={styles.chartPath} d={chartLine} />}
                    {plottedPoints.map((point) => <circle key={point.time} className={styles.chartPoint} cx={point.x} cy={point.y} r="4" />)}
                  </svg>
                </div>
                <div className={styles.chartTimes}>
                  {chartPoints.filter((_, index) => index % Math.max(1, Math.ceil(chartPoints.length / 6)) === 0 || index === chartPoints.length - 1).map((point) => (
                    <span key={point.time}>{formatHour(point.time)}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>}

        {view === "insights" && (
          <section className={styles.insightsSection}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.sectionEyebrow}>SUPPORTED BY THIS FORECAST</p><h2>Read the current pattern</h2></div>
              <p className={styles.updatedAt}>{currentTime ? `${formatDate(currentTime)} · ${formatHour(currentTime)} UTC` : "Forecast time unavailable"}</p>
            </div>
            <div className={styles.insightGrid}>
              <article className={styles.infoCard}>
                <span className={styles.infoLabel}>CURRENT WAVE HEIGHT</span>
                <strong>{loading ? "Loading…" : formatMeasurement(currentWave, forecast?.hourly_units?.wave_height ?? "m")}</strong>
                <p>{loading ? "Waiting for the marine forecast." : seaState(currentWave)} · {location.name}</p>
              </article>
              <article className={styles.infoCard}>
                <span className={styles.infoLabel}>NEXT 12 HOURS</span>
                <strong>{chartPoints.length} available readings</strong>
                <p>Based on the hourly wave-height values returned for this location.</p>
              </article>
              <article className={styles.infoCard}>
                <span className={styles.infoLabel}>DATA SCOPE</span>
                <strong>Short-range outlook</strong>
                <p>No historical comparisons or long-term trend claims are presented.</p>
              </article>
            </div>
            {error && <p className={styles.dataLimitation} role="status">The forecast could not be loaded, so condition insights are unavailable right now.</p>}
            <Link className={styles.inlineLink} href="/forecast">View the hourly forecast <span aria-hidden="true">→</span></Link>
          </section>
        )}

        {view === "safety" && (
          <section className={styles.infoPageSection}>
            <div className={styles.safetyNotice} role="note">
              <strong>Important</strong>
              <p>OceanPulse does not provide official marine safety warnings, rescue guidance, or real-time hazard alerts. Always follow local authorities, lifeguards, and official marine forecasts.</p>
            </div>
            <div className={styles.insightGrid}>
              <article className={styles.infoCard}><span className={styles.infoLabel}>CHECK LOCAL GUIDANCE</span><strong>Use official sources</strong><p>Review local beach notices, marine forecasts, and advice from lifeguards before entering the water.</p></article>
              <article className={styles.infoCard}><span className={styles.infoLabel}>CONDITIONS CAN CHANGE</span><strong>Stay observant</strong><p>Wind, tides, currents, and weather can change quickly and may not be represented by the data shown here.</p></article>
              <article className={styles.infoCard}><span className={styles.infoLabel}>WHEN IN DOUBT</span><strong>Choose caution</strong><p>Avoid entering the water when conditions are unclear or beyond your experience, and follow local safety instructions.</p></article>
            </div>
          </section>
        )}

        {view === "about" && (
          <section className={styles.infoPageSection}>
            <div className={styles.aboutGrid}>
              <article className={styles.infoCard}><span className={styles.infoLabel}>PURPOSE</span><strong>Make marine conditions easier to explore</strong><p>OceanPulse is a frontend project for presenting coastal wave information, forecast context, and location-based exploration.</p></article>
              <article className={styles.infoCard}><span className={styles.infoLabel}>DATA SOURCE</span><strong>Open-Meteo Marine API</strong><p>The existing app requests hourly wave height, wave direction, and sea-surface temperature through its current marine forecast endpoint.</p></article>
              <article className={styles.infoCard}><span className={styles.infoLabel}>LIMITATIONS</span><strong>Not an official forecast service</strong><p>Availability and accuracy depend on the upstream data provider. Wind data, historical comparisons, and official alerts are not part of the current response.</p></article>
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <Link className={styles.footerBrand} href="/" aria-label="OceanPulse home">
            <Image className={styles.footerLogo} src="/oceanpulse-logo-clean.png" alt="" width={735} height={455} />
          </Link>
          <span>Marine data · Open-Meteo · Not official safety guidance</span>
          <Link href={isHome ? "#top" : "/"}>{isHome ? "Back to top ↑" : "Home"}</Link>
        </footer>
      </main>
    </div>
  );
}
