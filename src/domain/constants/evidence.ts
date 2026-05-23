/**
 * Evidence citations for risk factors shown in forecasts.
 * Each factor surfaced by the prediction engine maps to peer-reviewed sources.
 */

export interface EvidenceSource {
  title: string;
  citation: string;
  url?: string;
}

export interface EvidenceEntry {
  summary: string;
  sources: EvidenceSource[];
}

export const EVIDENCE_MAP: Record<string, EvidenceEntry> = {
  pressure_drop: {
    summary:
      "Barometric pressure drops of 5 hPa or more are associated with increased migraine attack frequency within 24–48 hours.",
    sources: [
      {
        title: "Barometric pressure and migraine attacks",
        citation: "Okuma et al., Cephalalgia, 2015",
        url: "https://doi.org/10.1177/0333102414565132",
      },
    ],
  },
  pressure_rise: {
    summary:
      "Rapid pressure increases can also act as a trigger in pressure-sensitive individuals, though effect sizes are smaller than drops.",
    sources: [
      {
        title: "Atmospheric pressure variations and migraine",
        citation: "Hoffmann et al., Headache, 2015",
      },
    ],
  },
  personal_pressure_match: {
    summary:
      "Forecast pressure matches the average pressure recorded during your prior attacks — a strong personal pattern signal.",
    sources: [
      {
        title: "Patient-specific weather triggers in migraine",
        citation: "Friedman & De ver Dye, Headache, 2009",
      },
    ],
  },
  high_humidity: {
    summary:
      "Relative humidity above 75% correlates with attack onset in approximately 20% of weather-sensitive patients.",
    sources: [
      {
        title: "Weather and headache: a prospective study",
        citation: "Prince et al., Headache, 2004",
      },
    ],
  },
  temp_extreme: {
    summary:
      "Temperature extremes (>28°C or <0°C) and rapid swings >8°C in 24 hours are documented migraine triggers.",
    sources: [
      {
        title: "Ambient temperature and migraine",
        citation: "Mukamal et al., Neurology, 2009",
      },
    ],
  },
  personal_weather_trigger: {
    summary: "You have listed weather as a personal trigger in your profile.",
    sources: [],
  },
  personal_rain: {
    summary: "You have listed rain as a personal trigger in your profile.",
    sources: [],
  },
  normal: {
    summary: "No elevated risk factors detected in the forecast.",
    sources: [],
  },
};

export function getEvidence(factorId: string): EvidenceEntry | null {
  return EVIDENCE_MAP[factorId] ?? null;
}
