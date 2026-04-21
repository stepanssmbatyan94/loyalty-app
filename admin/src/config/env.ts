export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? '',
  APP_URL: import.meta.env.VITE_APP_URL ?? '',
  MODE: import.meta.env.MODE,       // 'development' | 'production' | 'test'
  DEV: import.meta.env.DEV,         // true in dev server
  PROD: import.meta.env.PROD,       // true after vite build
};
