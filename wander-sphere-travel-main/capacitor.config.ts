import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onenomadsolutions.app',
  appName: 'WanderSphere',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#ffffff"
    },
    Geolocation: {
      permissions: ['location']
    },
    // Camera plugin: direct capture only; no photo library permission needed.
    // The System Photo Picker is used instead (via <input type="file">).
  }
};

export default config;
