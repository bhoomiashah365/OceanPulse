import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Coastal Safety | OceanPulse",
  description: "Practical coastal safety reminders and links to verified official marine forecast resources.",
};

const navigation = [
  { href: "/", label: "Home" },
  { href: "/live-conditions", label: "Live conditions" },
  { href: "/forecast", label: "Forecast" },
  { href: "/map", label: "Explore map" },
  { href: "/insights", label: "Insights" },
  { href: "/coastal-safety", label: "Coastal safety" },
  { href: "/about", label: "About" },
];

const safetyGuidance = [
  {
    number: "01",
    title: "Beach safety",
    description: "Check posted beach flags and local guidance. Swim only where permitted, and ask a lifeguard about current conditions.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 36h28M14 31l10-17 10 17M18 25h12M21 20h6" />
        <path d="M24 14V8m0 0 8 3-8 3" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Waves & currents",
    description: "Waves, tides, and currents can change quickly. Conditions near jetties, rocks, and river mouths may be especially variable.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M5 18c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 8 5M5 27c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 8 5M5 36c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 8 5" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Weather awareness",
    description: "Review official local weather and marine forecasts before heading out. Conditions offshore can differ from those on the beach.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M14 32h20a7 7 0 0 0 .4-14A11 11 0 0 0 13 20a6 6 0 0 0 1 12Z" />
        <path d="m18 38-2 3m11-3-2 3m11-3-2 3" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Emergency preparedness",
    description: "Know how to contact local emergency services, tell someone your plans, and follow lifeguard and authority instructions.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 6 39 12v10c0 10-6.5 16-15 20C15.5 38 9 32 9 22V12l15-6Z" />
        <path d="M24 16v11m0 6h.01" />
      </svg>
    ),
  },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11m-5-5 5 5-5 5" />
    </svg>
  );
}

export default function CoastalSafetyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="OceanPulse home">
          <Image className={styles.brandLogo} src="/oceanpulse-logo-clean.png" alt="" width={735} height={455} priority />
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className={item.href === "/coastal-safety" ? styles.navLinkActive : styles.navLink}
              href={item.href}
              aria-current={item.href === "/coastal-safety" ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="safety-heading">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}><span /> COASTAL AWARENESS · FIELD GUIDE</p>
            <h1 id="safety-heading">Coastal <span>Safety</span></h1>
            <p className={styles.heroDescription}>
              A calmer coast starts with good information. Prepare for changing conditions and let local experts guide your decisions.
            </p>
            <a className={styles.heroLink} href="#safety-guidance">
              Explore the safety guide <ArrowIcon />
            </a>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <span className={`${styles.heroOrb} ${styles.heroOrbOuter}`} />
            <span className={`${styles.heroOrb} ${styles.heroOrbInner}`} />
            <span className={styles.heroHorizon} />
            <span className={`${styles.heroWave} ${styles.heroWaveBack}`} />
            <span className={`${styles.heroWave} ${styles.heroWaveFront}`} />
            <span className={styles.heroVisualLabel}>RESPECT THE WATER</span>
          </div>
          <div className={styles.heroMeta}><span>OCEANPULSE SAFETY DESK</span><span>KNOW BEFORE YOU GO</span></div>
        </section>

        <section className={styles.guidanceSection} id="safety-guidance" aria-labelledby="guidance-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>A MOMENT TO PREPARE</p>
              <h2 id="guidance-heading">Four ways to stay <span>coast-aware</span></h2>
            </div>
            <p>Use this guide as a reminder—not a substitute for local advice or official forecasts.</p>
          </div>
          <div className={styles.cardGrid}>
            {safetyGuidance.map((item) => (
              <article className={styles.safetyCard} key={item.number}>
                <div className={styles.cardTopline}>
                  <span className={styles.cardIcon}>{item.icon}</span>
                  <span className={styles.cardNumber}>{item.number}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className={styles.cardAccent} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className={styles.conditionsSection} aria-labelledby="conditions-heading">
          <div className={styles.conditionsPanel}>
            <div className={styles.conditionsCopy}>
              <p className={styles.sectionEyebrow}>DATA TRANSPARENCY</p>
              <h2 id="conditions-heading">Marine conditions</h2>
              <p>This safety page does not receive live marine readings. No sample values, hazard scores, or real-time alerts are shown here.</p>
            </div>
            <div className={styles.dataStatus}>
              <span className={styles.statusIndicator} aria-hidden="true" />
              <div><strong>Live data not connected</strong><span>Check an official forecast for your location.</span></div>
            </div>
          </div>
        </section>

        <section className={styles.resourcesSection} aria-labelledby="resources-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>TRUSTED SOURCES</p>
              <h2 id="resources-heading">Start with <span>official guidance</span></h2>
            </div>
            <p>These National Weather Service resources apply to U.S. waters. Elsewhere, consult your national weather service and local beach authority.</p>
          </div>
          <div className={styles.resourceGrid}>
            <a className={styles.resourceCard} href="https://www.weather.gov/marine/" target="_blank" rel="noreferrer">
              <span className={styles.resourceType}>NATIONAL WEATHER SERVICE · U.S.</span>
              <strong>Marine forecasts & warnings</strong>
              <span className={styles.resourceDescription}>Official coastal, offshore, and high-seas forecast products.</span>
              <span className={styles.resourceAction}>Open marine services <ArrowIcon /></span>
            </a>
            <a className={styles.resourceCard} href="https://www.weather.gov/safety/ripcurrent-forecasts" target="_blank" rel="noreferrer">
              <span className={styles.resourceType}>NATIONAL WEATHER SERVICE · U.S.</span>
              <strong>Rip current outlooks</strong>
              <span className={styles.resourceDescription}>Learn about surf-zone rip current outlooks and beach checks.</span>
              <span className={styles.resourceAction}>View beach guidance <ArrowIcon /></span>
            </a>
          </div>
        </section>

        <aside className={styles.disclaimer} role="note" aria-label="Safety disclaimer">
          <span className={styles.disclaimerIcon} aria-hidden="true">!</span>
          <div>
            <span className={styles.disclaimerLabel}>IMPORTANT SAFETY DISCLAIMER</span>
            <p>OceanPulse does not provide official marine safety warnings, rescue guidance, or real-time hazard alerts. Always follow local authorities, lifeguards, and official marine forecasts.</p>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="/" aria-label="OceanPulse home">
          <Image className={styles.footerLogo} src="/oceanpulse-logo-clean.png" alt="" width={735} height={455} />
        </Link>
        <span>Marine data · Not official safety guidance</span>
        <Link href="/">Back to OceanPulse <span aria-hidden="true">↑</span></Link>
      </footer>
    </div>
  );
}
