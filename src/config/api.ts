import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;

// Si querés sobreescribir la URL sin usar .env, poné acá la URL del backend.
// Ejemplo: 'http://201.32.129.48:8000'
const MANUAL_API_URL: string = '';

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (MANUAL_API_URL) return MANUAL_API_URL.replace(/\/$/, '');

  // En navegador web siempre apuntamos al backend local en localhost
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}`;
  }

  // Expo ya tiene abierto su propio puerto (ej: "192.168.18.16:8081") en el Firewall de Windows.
  // Usamos el proxy /api/* de metro.config.js para llegar a FastAPI (127.0.0.1:8000) sin bloqueos.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const [host, metroPort = '8081'] = hostUri.split(':');
    if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
      return `http://10.0.2.2:${metroPort}`;
    }
    return `http://${host}:${metroPort}`;
  }

  // Fallback: emulador Android usa 10.0.2.2 para llegar a la PC
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${API_PORT}`
    : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();
export const ANDROID_EMULATOR_URL = `http://10.0.2.2:${API_PORT}`;
export const REQUEST_TIMEOUT_MS = 10000;
