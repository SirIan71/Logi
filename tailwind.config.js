import formsPlugin from '@tailwindcss/forms';
import containerQueriesPlugin from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
          "colors": {
              "on-secondary-fixed-variant": "#3c4d00",
              "outline": "#70797a",
              "primary": "#003539",
              "on-primary-fixed-variant": "#0b4e54",
              "surface-dim": "#d7dbda",
              "on-surface": "#181c1c",
              "surface-container-low": "#f1f4f3",
              "on-surface-variant": "#404849",
              "surface-container-high": "#e6e9e8",
              "tertiary-fixed-dim": "#86d3d7",
              "primary-container": "#084d53",
              "tertiary-fixed": "#a2f0f4",
              "on-tertiary-fixed": "#002021",
              "error-container": "#ffdad6",
              "surface-container": "#ebeeed",
              "surface-tint": "#2c676d",
              "error": "#ba1a1a",
              "tertiary": "#003538",
              "on-error": "#ffffff",
              "on-background": "#181c1c",
              "secondary": "#516600",
              "surface-container-highest": "#e0e3e2",
              "on-tertiary-fixed-variant": "#004f52",
              "on-tertiary-container": "#73c0c4",
              "on-secondary-fixed": "#161e00",
              "on-secondary-container": "#566c00",
              "on-secondary": "#ffffff",
              "secondary-container": "#cef063",
              "primary-fixed-dim": "#97d0d7",
              "on-primary-container": "#84bdc3",
              "inverse-surface": "#2d3131",
              "surface": "#f7faf9",
              "on-tertiary": "#ffffff",
              "on-primary": "#ffffff",
              "primary-fixed": "#b3ecf3",
              "inverse-primary": "#97d0d7",
              "background": "#f7faf9",
              "tertiary-container": "#004e51",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed": "#cef063",
              "outline-variant": "#bfc8c9",
              "inverse-on-surface": "#eef1f0",
              "on-error-container": "#93000a",
              "secondary-fixed-dim": "#b3d34a",
              "on-primary-fixed": "#002023",
              "surface-variant": "#e0e3e2",
              "surface-bright": "#f7faf9"
          },
          "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "1.5rem",
              "full": "9999px"
          },
          "fontFamily": {
              "headline": ["Plus Jakarta Sans", "sans-serif"],
              "body": ["Inter", "sans-serif"],
              "label": ["Inter", "sans-serif"]
          }
      },
  },
  plugins: [
    formsPlugin,
    containerQueriesPlugin,
  ],
}
