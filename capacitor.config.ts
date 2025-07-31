import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.velar.migraineprediction',
  appName: 'velar-predict-flow',
  webDir: 'dist',
  server: {
    url: 'https://242be132-4c3f-416d-a396-458309c7f49b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;