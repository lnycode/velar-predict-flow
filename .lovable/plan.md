

# Professional Design Audit & Improvement Plan

After reviewing the full codebase, here are the key areas that need improvement to achieve a highly professional, clinical-grade application:

## 1. Header Bar -- Remove Clutter & Fake Indicators

**Problem**: The header shows a permanently lit "Pattern Analysis Active" badge and an always-visible "Early-Warning Signal" alert. These are hardcoded, not data-driven, and feel gimmicky rather than professional. A real clinical tool would only show alerts when there's actual data to back them.

**Fix**: Remove the static status indicators from the header. Replace with a clean, minimal header showing just the Velar wordmark, subtitle, language selector, and a user avatar/menu. Only show risk alerts when the prediction data warrants it.

## 2. Dashboard Welcome Card -- Remove Emoji, Tighten Hierarchy

**Problem**: The welcome card uses a sparkle emoji (`✨`) in the title, which undermines clinical credibility. The risk score display lacks a visual gauge.

**Fix**: Remove the emoji. Add a subtle circular or linear progress indicator for the risk score instead of just text. Use proper typographic hierarchy with lighter weight subtitles.

## 3. App.css -- Remove Unused Boilerplate

**Problem**: `src/App.css` contains Vite starter boilerplate (logo spin animation, `.read-the-docs`, max-width constraint) that conflicts with the full-width layout and is completely unused.

**Fix**: Delete all contents of `App.css` or remove the file and its import.

## 4. Sidebar Footer Version Mismatch

**Problem**: Sidebar footer says "Velar v3.0" while Settings page says "v2.1.0". Inconsistent versioning looks unprofessional.

**Fix**: Unify to a single version constant used everywhere.

## 5. Auth Page -- Overly Promotional Copy

**Problem**: "Join the Future of Migraine Care" and "Launch My Velar Journey" read like marketing, not a professional medical tool. The Rocket icon reinforces this.

**Fix**: Use clinical, neutral language: "Sign In" / "Create Account". Replace Rocket icon with a neutral shield or key icon. Keep copy professional: "Data-driven Migraine Risk Estimation Platform".

## 6. Loading States -- Add Skeleton Shimmer

**Problem**: Loading states use plain gray rectangles (`bg-secondary/30`). Professional apps use skeleton shimmer animations.

**Fix**: Create a reusable `Skeleton` component (already exists in ui) and apply shimmer animation to loading placeholders across Dashboard, DiaryPage, and RiskForecast.

## 7. Starry Background Effect -- Too Distracting

**Problem**: The `body::before` starry dots effect is repeated every 200px and feels like a novelty rather than premium. At 30% opacity it's visible enough to distract.

**Fix**: Reduce opacity to 10-15%, increase background-size for subtlety, or replace with a simple radial gradient vignette for depth.

## 8. Consistent Card Styling

**Problem**: Cards use a mix of `velar-card`, `velar-card border-border/50`, and plain `Card` without consistent treatment.

**Fix**: Standardize all cards to use `velar-card` class. Remove redundant border overrides by incorporating `border-border/50` into the `.velar-card` base class in CSS.

## 9. RiskForecast Mock Data Indicator

**Problem**: The forecast component generates random mock data (`Math.random()`) but presents it as real predictions. Only a small beta disclaimer at the bottom hints at this. This is misleading in a clinical context.

**Fix**: When showing mock/simulated data, display a clear "Simulated Data" watermark or banner so users understand it's not real prediction output.

## 10. Settings Version Footer

**Problem**: Settings "About" section shows hardcoded `v2.1.0` and `2025` copyright year while current date is 2026.

**Fix**: Use dynamic year (`new Date().getFullYear()`) and a shared version constant.

---

## Implementation Priority

| Priority | Item | Impact |
|----------|------|--------|
| High | Remove header fake indicators (#1) | Credibility |
| High | Remove emoji from dashboard (#2) | Clinical tone |
| High | Clean up App.css (#3) | Code hygiene |
| High | Fix auth page copy (#5) | First impression |
| Medium | Reduce starry background (#7) | Visual polish |
| Medium | Standardize card styling (#8) | Consistency |
| Medium | Version consistency (#4, #10) | Attention to detail |
| Low | Skeleton loading (#6) | Polish |
| Low | Mock data indicator (#9) | Transparency |

