import { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, ScrollView, Platform, KeyboardAvoidingView, type LayoutChangeEvent } from 'react-native';
import { Text, TextInput } from './Typo';
import { TOUCH } from '../theme';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';

type Props = {
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
};

const authColors = {
  bg: '#0D0C18',
  surface: '#161526',
  surfaceCard: '#141322',
  inputBg: '#181728',
  inputBorder: 'rgba(255, 255, 255, 0.08)',
  inputBorderFocus: '#7B6CF6',
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  primary: '#7B6CF6',
  primaryHover: '#6857EA',
  primaryLink: '#8B7CFF',
  text: '#FFFFFF',
  textSecondary: '#9F9BB8',
  textMuted: '#8B87A6',
  placeholder: '#6E6A85',
  coral: '#FF7E55',
  coralSoft: '#FFA27F',
  dangerBg: 'rgba(239, 68, 68, 0.14)',
  dangerBorder: '#EF4444',
  dangerText: '#FCA5A5',
  successBg: 'rgba(16, 185, 129, 0.14)',
  successBorder: '#10B981',
  successText: '#6EE7B7',
};

const DISPLAY_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: undefined,
});

export function AuthScreen({ onSuccess, onContinueAsGuest }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');

  let auth: ReturnType<typeof useAuth> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    // Silencioso en tests que rendericen AuthScreen sin AuthProvider
  }

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de focus y hover
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [btnHovered, setBtnHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mensajes de feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Medición del ancho del segmented control para que el slide sea exacto en cualquier pantalla
  const [tabTrackWidth, setTabTrackWidth] = useState(320);

  // Animaciones de slide suave entre Login y Register
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  function handleTabTrackLayout(event: LayoutChangeEvent) {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0) {
      setTabTrackWidth(measured);
    }
  }

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return;
    setFormError(null);
    setFormSuccess(null);

    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newMode === 'register' ? 1 : 0,
        duration: 320,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode(newMode);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }

  async function handleSubmit() {
    setFormError(null);
    setFormSuccess(null);

    if (mode === 'register') {
      if (!email.trim() || !email.includes('@')) {
        setFormError('Ingresá un correo electrónico válido.');
        return;
      }
      if (password.length < 6) {
        setFormError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Las contraseñas no coinciden.');
        return;
      }

      setSubmitting(true);
      try {
        if (auth) {
          await auth.signUp(email.split('@')[0], email.trim(), password);
        }
        setFormSuccess('¡Cuenta creada con éxito! Ingresando...');
        setTimeout(() => {
          onSuccess?.();
        }, 450);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : 'No pudimos crear tu cuenta. Intentá nuevamente.',
        );
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!email.trim()) {
        setFormError('Por favor ingresá tu correo electrónico.');
        return;
      }
      if (!password) {
        setFormError('Por favor ingresá tu contraseña.');
        return;
      }

      setSubmitting(true);
      try {
        if (auth) {
          await auth.signIn(email.trim(), password);
        }
        setFormSuccess('¡Bienvenido de vuelta! Cargando tus tareas...');
        setTimeout(() => {
          onSuccess?.();
        }, 450);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : 'Credenciales inválidas. Verificá tus datos.',
        );
      } finally {
        setSubmitting(false);
      }
    }
  }

  const pillWidth = Math.max((tabTrackWidth - 8) / 2, 100);
  const tabPillX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  const formSlideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const heroCardRotate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['9deg', '4deg'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentColumn}>
          {/* ================= MARCA SUPERIOR ================= */}
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Text style={styles.brandIconLetter}>
                T<Text style={styles.brandIconDot}>.</Text>
              </Text>
            </View>
            <Text style={styles.brandTitle}>Taskify</Text>
          </View>

          {/* ================= BANNER HERO ILUSTRATIVO ================= */}
          <View style={styles.heroBanner}>
            {/* Halos ambientales suaves (durazno arriba-izq, teal abajo-centro, violeta derecha) */}
            <View style={styles.glowWarm} />
            <View style={styles.glowTeal} />
            <View style={styles.glowViolet} />

            {/* Destellos decorativos */}
            <Text style={styles.sparkleLeft}>✦</Text>
            <Text style={styles.sparkleTop}>✦</Text>

            {/* Tarjeta inclinada de checklist con badge flotante */}
            <Animated.View
              style={[
                styles.floatingChecklistWrap,
                { transform: [{ rotate: heroCardRotate }] },
              ]}
            >
              <View style={styles.floatingCheckBadge}>
                <Text style={styles.floatingCheckMark}>✓</Text>
              </View>
              <View style={styles.miniCard}>
                <View style={styles.miniRow}>
                  <View style={[styles.miniDot, { backgroundColor: '#34D399' }]} />
                  <View style={[styles.miniBar, { width: 58 }]} />
                </View>
                <View style={styles.miniRow}>
                  <View style={[styles.miniDot, { backgroundColor: '#818CF8' }]} />
                  <View style={[styles.miniBar, { width: 46 }]} />
                </View>
                <View style={styles.miniRow}>
                  <View style={[styles.miniDot, { backgroundColor: '#F472B6' }]} />
                  <View style={[styles.miniBar, { width: 52 }]} />
                </View>
                <View style={styles.miniRow}>
                  <View style={[styles.miniDot, { backgroundColor: '#FBBF24' }]} />
                  <View style={[styles.miniBar, { width: 38 }]} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* ================= TÍTULO Y BAJADA ================= */}
          <Animated.View
            style={[
              styles.headerBlock,
              {
                opacity: contentFadeAnim,
                transform: [{ translateX: formSlideX }],
              },
            ]}
          >
            <Text style={styles.heading}>
              {mode === 'login' ? '¡Bienvenido, volviste!' : '¡Creá tu cuenta gratis!'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Ingresá para seguir con tus victorias diarias y mantener el foco.'
                : 'Sumate a Taskify para organizar tu día y convertir metas en logros.'}
            </Text>
          </Animated.View>

          {/* ================= SEGMENTED CONTROL DESLIZANTE ================= */}
          <View style={styles.tabTrack} onLayout={handleTabTrackLayout}>
            <Animated.View
              style={[
                styles.tabPill,
                {
                  width: pillWidth,
                  transform: [{ translateX: tabPillX }],
                },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
              style={styles.tabButton}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Iniciar sesión
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crear cuenta"
              style={styles.tabButton}
              onPress={() => switchMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Crear cuenta
              </Text>
            </Pressable>
          </View>

          {/* ================= ALERTAS DE FEEDBACK ================= */}
          {formError ? (
            <View style={styles.errorAlert}>
              <Text style={styles.errorAlertText}>⚠️ {formError}</Text>
            </View>
          ) : null}

          {formSuccess ? (
            <View style={styles.successAlert}>
              <Text style={styles.successAlertText}>✨ {formSuccess}</Text>
            </View>
          ) : null}

          {/* ================= CAMPOS DEL FORMULARIO ================= */}
          <Animated.View
            style={[
              styles.formBlock,
              {
                opacity: contentFadeAnim,
                transform: [{ translateX: formSlideX }],
              },
            ]}
          >
            {/* Correo electrónico */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                testID="auth-email-input"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (formError) setFormError(null);
                }}
                placeholder="nombre@ejemplo.com"
                placeholderTextColor={authColors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={[
                  styles.textInput,
                  focusedField === 'email' && styles.textInputFocused,
                ]}
              />
            </View>

            {/* Contraseña con botón de mostrar/ocultar */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View
                style={[
                  styles.passwordContainer,
                  focusedField === 'password' && styles.textInputFocused,
                ]}
              >
                <TextInput
                  testID="auth-password-input"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (formError) setFormError(null);
                  }}
                  placeholder={mode === 'login' ? '••••••••••' : 'Mínimo 6 caracteres'}
                  placeholderTextColor={authColors.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={styles.passwordInput}
                />
                <Pressable
                  testID="toggle-password-visibility"
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Confirmar contraseña (solo en Crear cuenta) */}
            {mode === 'register' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                <View
                  style={[
                    styles.passwordContainer,
                    focusedField === 'confirm' && styles.textInputFocused,
                  ]}
                >
                  <TextInput
                    testID="register-confirm-password-input"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Repetí tu contraseña"
                    placeholderTextColor={authColors.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.passwordInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'
                    }
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Fila Recordarme + ¿Olvidaste tu clave? (solo en Iniciar sesión) */
              <View style={styles.optionsRow}>
                <Pressable
                  testID="remember-me-checkbox"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => setRememberMe((prev) => !prev)}
                  style={styles.rememberRow}
                >
                  <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe ? <Text style={styles.checkboxTick}>✓</Text> : null}
                  </View>
                  <Text style={styles.rememberText}>Recordarme</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setFormError('Contactá a tu docente o creá una cuenta nueva para probar.')
                  }
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.forgotLink}>¿Olvidaste tu clave?</Text>
                </Pressable>
              </View>
            )}

            {/* Botón CTA Principal */}
            <Pressable
              testID="auth-submit-button"
              accessibilityRole="button"
              accessibilityLabel={mode === 'login' ? 'Ingresar a Taskify' : 'Crear mi cuenta'}
              disabled={submitting}
              onPress={handleSubmit}
              // @ts-ignore soporte hover web
              onHoverIn={() => setBtnHovered(true)}
              // @ts-ignore
              onHoverOut={() => setBtnHovered(false)}
              style={({ pressed }) => [
                styles.submitButton,
                (btnHovered || pressed) && styles.submitButtonHover,
                submitting && styles.submitButtonDisabled,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {submitting
                  ? 'Conectando...'
                  : mode === 'login'
                    ? 'Ingresar a Taskify  →'
                    : 'Crear mi cuenta  →'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* ================= TARJETA MOTIVADORA INFERIOR ================= */}
          <Animated.View
            style={[
              styles.habitCard,
              {
                opacity: contentFadeAnim,
                transform: [{ translateX: formSlideX }],
              },
            ]}
          >
            <View style={styles.habitIconBox}>
              <Text style={styles.habitIcon}>💡</Text>
            </View>
            <View style={styles.habitContent}>
              <Text style={styles.habitEyebrow}>
                {mode === 'login' ? 'HÁBITO DE HOY' : 'TU PRIMER PASO'}
              </Text>
              <Text style={styles.habitText}>
                {mode === 'login'
                  ? 'El enfoque diario construye grandes logros. Empezá con una sola tarea bien hecha.'
                  : 'Organizar tus metas te da claridad y paz mental. Creá tu cuenta en segundos.'}
              </Text>
            </View>
          </Animated.View>

          {/* ================= FOOTER DE CAMBIO DE MODO ================= */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>
              {mode === 'login' ? '¿No tenés una cuenta todavía?' : '¿Ya tenés una cuenta?'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
              // @ts-ignore
              onHoverIn={() => setLinkHovered(true)}
              // @ts-ignore
              onHoverOut={() => setLinkHovered(false)}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={[styles.footerLink, linkHovered && styles.footerLinkHover]}>
                {mode === 'login' ? 'Creá una gratis' : 'Iniciá sesión'}
              </Text>
            </Pressable>
          </View>

          {/* Acceso directo como invitado para pruebas / demo */}
          <Pressable
            testID="auth-guest-button"
            accessibilityRole="button"
            onPress={() => {
              try {
                auth?.continueAsGuest();
              } catch {
                // ignorar
              }
              onContinueAsGuest ? onContinueAsGuest() : onSuccess?.();
            }}
            style={({ pressed }) => [styles.guestLinkWrap, pressed && styles.pressed]}
          >
            <Text style={styles.guestLinkText}>Continuar sin cuenta (modo demo) →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: authColors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  contentColumn: {
    width: '100%',
    maxWidth: 420,
  },
  pressed: {
    opacity: 0.7,
  },

  // ================= MARCA SUPERIOR =================
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#151329',
    borderWidth: 1.5,
    borderColor: '#4E41A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconLetter: {
    color: '#8E84FF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandIconDot: {
    color: authColors.coral,
    fontSize: 22,
    fontWeight: '900',
  },
  brandTitle: {
    color: authColors.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: 0.2,
  },

  // ================= HERO BANNER =================
  heroBanner: {
    height: 118,
    borderRadius: 20,
    backgroundColor: '#18162C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 24,
  },
  glowWarm: {
    position: 'absolute',
    top: -36,
    left: -18,
    width: 150,
    height: 130,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 126, 85, 0.24)',
  },
  glowTeal: {
    position: 'absolute',
    bottom: -48,
    left: 110,
    width: 140,
    height: 110,
    borderRadius: 70,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
  },
  glowViolet: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 160,
    height: 140,
    borderRadius: 80,
    backgroundColor: 'rgba(123, 108, 246, 0.30)',
  },
  sparkleLeft: {
    position: 'absolute',
    left: 38,
    bottom: 24,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
  },
  sparkleTop: {
    position: 'absolute',
    left: 156,
    top: 18,
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
  },
  floatingChecklistWrap: {
    position: 'absolute',
    right: 26,
    top: 10,
  },
  floatingCheckBadge: {
    position: 'absolute',
    top: -6,
    left: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6E60F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#6E60F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCheckMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  miniCard: {
    width: 104,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1E1D33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 8,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  miniBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  // ================= TÍTULO Y SUBTÍTULO =================
  headerBlock: {
    marginBottom: 20,
  },
  heading: {
    color: authColors.text,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: authColors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },

  // ================= SEGMENTED CONTROL =================
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: authColors.surface,
    borderWidth: 1,
    borderColor: authColors.borderSubtle,
    borderRadius: 14,
    padding: 4,
    position: 'relative',
    marginBottom: 20,
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 11,
    backgroundColor: authColors.primary,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: authColors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ================= ALERTAS =================
  errorAlert: {
    backgroundColor: authColors.dangerBg,
    borderLeftWidth: 3,
    borderLeftColor: authColors.dangerBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorAlertText: {
    color: authColors.dangerText,
    fontSize: 13,
    fontWeight: '700',
  },
  successAlert: {
    backgroundColor: authColors.successBg,
    borderLeftWidth: 3,
    borderLeftColor: authColors.successBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successAlertText: {
    color: authColors.successText,
    fontSize: 13,
    fontWeight: '700',
  },

  // ================= FORMULARIO =================
  formBlock: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#D3CFE6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 50,
    backgroundColor: authColors.inputBg,
    borderWidth: 1.5,
    borderColor: authColors.inputBorder,
    borderRadius: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: authColors.text,
  },
  passwordContainer: {
    minHeight: 50,
    backgroundColor: authColors.inputBg,
    borderWidth: 1.5,
    borderColor: authColors.inputBorder,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: authColors.text,
  },
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 16,
    color: authColors.textMuted,
  },
  textInputFocused: {
    borderColor: authColors.inputBorderFocus,
  },

  // ================= OPCIONES LOGIN =================
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 36,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkboxTick: {
    color: authColors.bg,
    fontSize: 12,
    fontWeight: '900',
    marginTop: -1,
  },
  rememberText: {
    color: '#C9C5DC',
    fontSize: 13,
    fontWeight: '600',
  },
  forgotLink: {
    color: authColors.primaryLink,
    fontSize: 13,
    fontWeight: '800',
  },

  // ================= BOTÓN PRINCIPAL =================
  submitButton: {
    minHeight: Math.max(TOUCH, 54),
    backgroundColor: authColors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: authColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 5,
  },
  submitButtonHover: {
    backgroundColor: authColors.primaryHover,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ================= TARJETA MOTIVADORA INFERIOR =================
  habitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: authColors.surfaceCard,
    borderWidth: 1,
    borderColor: authColors.borderSubtle,
    borderRadius: 16,
    padding: 16,
    marginTop: 32,
  },
  habitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#1E1C33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIcon: {
    fontSize: 18,
  },
  habitContent: {
    flex: 1,
  },
  habitEyebrow: {
    color: authColors.coral,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  habitText: {
    color: '#B6B2CC',
    fontSize: 13,
    lineHeight: 19,
  },

  // ================= FOOTER =================
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  footerPrompt: {
    color: authColors.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: authColors.primaryLink,
    fontSize: 13,
    fontWeight: '800',
  },
  footerLinkHover: {
    textDecorationLine: 'underline',
  },
  guestLinkWrap: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  guestLinkText: {
    color: '#6E6A85',
    fontSize: 12,
    fontWeight: '700',
  },
});
