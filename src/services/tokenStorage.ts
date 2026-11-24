import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'taskify_auth_token';

/**
 * Almacenamiento persistente y seguro para el token JWT.
 * En Android / iOS utiliza SecureStore (Keystore/Keychain).
 * En Web utiliza localStorage con fallback a memoria.
 */
let memoryTokenFallback: string | null = null;

export const tokenStorage = {
  async saveToken(token: string): Promise<void> {
    memoryTokenFallback = token;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
        return;
      }
      if (typeof jest === 'undefined') {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.warn('[tokenStorage] Error guardando token, usando memoria:', error);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(TOKEN_KEY);
        }
        return memoryTokenFallback;
      }
      if (typeof jest === 'undefined') {
        const val = await SecureStore.getItemAsync(TOKEN_KEY);
        if (val !== undefined && val !== null) return val;
      }
      return memoryTokenFallback;
    } catch (error) {
      console.warn('[tokenStorage] Error leyendo token, usando memoria:', error);
      return memoryTokenFallback;
    }
  },

  async deleteToken(): Promise<void> {
    memoryTokenFallback = null;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        return;
      }
      if (typeof jest === 'undefined') {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.warn('[tokenStorage] Error eliminando token:', error);
    }
  },
};
