import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { ApiError, request, setOnUnauthorizedListener } from '../services/apiClient';

export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthApiResponse = {
  token?: string;
  access_token?: string;
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isRestoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildUserFromResponse(data: AuthApiResponse, fallbackEmail: string, fallbackName?: string): User {
  const email = data.user?.email || fallbackEmail;
  const defaultName = fallbackName?.trim() || email.split('@')[0] || 'Usuario';
  return {
    id: String(data.user?.id ?? 'usr-auth'),
    name: data.user?.name || defaultName,
    email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restaurar sesión al abrir la app desde almacenamiento seguro
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = await tokenStorage.getToken();
        if (savedToken) {
          setToken(savedToken);
          setUser({
            id: 'usr-persisted',
            name: 'Facundo Esquivel',
            email: 'facundo@instituto.edu.ar',
          });
        }
      } catch (error) {
        console.warn('[AuthContext] Error restaurando sesión:', error);
      } finally {
        setIsRestoring(false);
      }
    }

    void restoreSession();
  }, []);

  // Escuchar respuestas 401 automáticas del cliente HTTP
  useEffect(() => {
    setOnUnauthorizedListener(() => {
      setToken(null);
      setUser(null);
    });
    return () => setOnUnauthorizedListener(null);
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    try {
      const data = await request<AuthApiResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const jwt = data.token || data.access_token;
      if (!jwt) {
        throw new Error('El servidor no devolvió un token JWT válido.');
      }

      await tokenStorage.saveToken(jwt);
      setToken(jwt);
      setUser(buildUserFromResponse(data, email));
    } catch (error) {
      // Si el backend remoto es público y no expone /api/auth/login (HTTP 404/405),
      // habilitamos sesión local para operar contra /tasks/.
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
        const localToken = `public_api_session_${Date.now()}`;
        await tokenStorage.saveToken(localToken);
        setToken(localToken);
        setUser(buildUserFromResponse({}, email));
        return;
      }
      throw error;
    }
  }

  async function signUp(name: string, email: string, password: string): Promise<void> {
    try {
      // El esquema de la tabla `users` recibe únicamente `email` y `password`
      const data = await request<AuthApiResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      let jwt = data.token || data.access_token;
      if (!jwt) {
        // Si /api/auth/register solo crea el usuario sin devolver JWT, iniciamos sesión automáticamente
        const loginData = await request<AuthApiResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        jwt = loginData.token || loginData.access_token;
      }

      if (!jwt) {
        throw new Error('Registro completado, pero no se pudo obtener el token JWT.');
      }

      await tokenStorage.saveToken(jwt);
      setToken(jwt);
      setUser(buildUserFromResponse(data, email, name));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
        const localToken = `public_api_session_${Date.now()}`;
        await tokenStorage.saveToken(localToken);
        setToken(localToken);
        setUser(buildUserFromResponse({}, email, name));
        return;
      }
      throw error;
    }
  }

  async function signOut(): Promise<void> {
    await tokenStorage.deleteToken();
    setToken(null);
    setUser(null);
  }

  function continueAsGuest(): void {
    const guestToken = 'guest_token_demo';
    setToken(guestToken);
    setUser({
      id: 'guest',
      name: 'Invitado',
      email: 'invitado@taskify.local',
    });
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isRestoring,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
    }),
    [user, token, isRestoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
