import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors, radius, TOUCH } from '../theme';

type AuthMode = 'login' | 'register';

type Props = {
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
};

export function AuthScreen({ onSuccess, onContinueAsGuest }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 820;

  // Campos de formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de focus en inputs para resaltar borde suave -> violeta
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Mensajes de error / éxito
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Estados de hover (para web)
  const [btnHovered, setBtnHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [guestHovered, setGuestHovered] = useState(false);

  // Animaciones para el "slide satisfactorio"
  // slideAnim: 0 = login, 1 = register
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  function switchMode(newMode: AuthMode) {
    if (newMode === mode) return;
    setFormError(null);
    setFormSuccess(null);

    // Animación suave coordinada: fade out rápido, slide, y fade in
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newMode === 'register' ? 1 : 0,
        duration: 340,
        easing: Easing.bezier(0.22, 1, 0.36, 1), // ease-out cubic elegante y satisfactorio
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode(newMode);
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }

  function handleSubmit() {
    setFormError(null);
    setFormSuccess(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setFormError('Por favor ingresá tu nombre completo.');
        return;
      }
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

      setFormSuccess('¡Cuenta creada con éxito! Ingresando...');
      setTimeout(() => {
        onSuccess?.();
      }, 700);
    } else {
      if (!email.trim()) {
        setFormError('Por favor ingresá tu correo o usuario.');
        return;
      }
      if (!password) {
        setFormError('Por favor ingresá tu contraseña.');
        return;
      }

      setFormSuccess('¡Inicio de sesión exitoso! Cargando tus tareas...');
      setTimeout(() => {
        onSuccess?.();
      }, 600);
    }
  }

  // Interpolaciones para el slide del panel izquierdo y del formulario
  const leftSlideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const formSlideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16],
  });

  const tabPillX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 142],
  });

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isLargeScreen && styles.scrollContainerLarge,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.cardContainer,
            isLargeScreen ? styles.cardContainerRow : styles.cardContainerColumn,
          ]}
        >
          {/* ================= PANEL IZQUIERDO (Índigo Profundo #1E1B4B con detalles Coral #FFA27F) ================= */}
          <View style={[styles.leftPanel, isLargeScreen ? styles.leftPanelWide : styles.leftPanelMobile]}>
            {/* Círculos decorativos sutiles de fondo */}
            <View style={styles.glowCircleOne} />
            <View style={styles.glowCircleTwo} />

            {/* Header de Marca */}
            <View style={styles.brandHeader}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandCheck}>✓</Text>
              </View>
              <Text style={styles.brandName}>Taskify</Text>
            </View>

            {/* Contenido motivador animado */}
            <Animated.View
              style={[
                styles.motivationBox,
                {
                  opacity: contentFadeAnim,
                  transform: [{ translateX: leftSlideX }],
                },
              ]}
            >
              {mode === 'login' ? (
                <>
                  <View style={styles.taglineChip}>
                    <Text style={styles.taglineChipText}>TU ESPACIO DE ENFOQUE</Text>
                  </View>
                  <Text style={styles.motivationHeading}>
                    ¡Hola de nuevo! Convertí cada día en una victoria personal.
                  </Text>
                  <Text style={styles.motivationLead}>
                    Organizarte no se trata de hacer más tareas, sino de hacer lo que realmente importa con calma y claridad mental.
                  </Text>

                  {/* Lista de beneficios motivadores con tildes en durazno/coral */}
                  <View style={styles.benefitList}>
                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Foco total y sin distracciones</Text>
                        <Text style={styles.benefitDesc}>
                          Sabé exactamente qué sigue y tachá lo urgente con tranquilidad.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Progreso visible en tiempo real</Text>
                        <Text style={styles.benefitDesc}>
                          Sentí la satisfacción diaria de ver tus objetivos cumplidos.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Menos estrés, más tiempo libre</Text>
                        <Text style={styles.benefitDesc}>
                          Liberá tu mente sabiendo que nada importante se te escapa.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>
                      “La constancia vence a la improvisación. Hacé que hoy cuente.”
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.taglineChip}>
                    <Text style={styles.taglineChipText}>COMIENZO DE TUS METAS</Text>
                  </View>
                  <Text style={styles.motivationHeading}>
                    Desbloqueá tu máximo potencial y superá tus límites.
                  </Text>
                  <Text style={styles.motivationLead}>
                    Unite a una forma más simple y gratificante de organizar tu vida. Tu mejor versión empieza con una lista clara y accionable.
                  </Text>

                  {/* Lista de beneficios motivadores para registro con tildes coral */}
                  <View style={styles.benefitList}>
                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Diseñado para impulsarte</Text>
                        <Text style={styles.benefitDesc}>
                          Una interfaz limpia y placentera que hace que tachar tareas dé gusto.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Cero fricción, 100% agilidad</Text>
                        <Text style={styles.benefitDesc}>
                          Creá, filtrá y completá tareas en segundos sin configuraciones eternas.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.benefitItem}>
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Gratis y siempre disponible</Text>
                        <Text style={styles.benefitDesc}>
                          Tu gestor personal listo para acompañarte estés donde estés.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>
                      “El secreto para salir adelante es simplemente dar el primer paso.”
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>
          </View>

          {/* ================= PANEL DERECHO / FORMULARIO (Lavanda #FAF8FF, Inputs Blancos, Botón Violeta #5B3FD9) ================= */}
          <View style={[styles.formPanel, isLargeScreen ? styles.formPanelWide : styles.formPanelMobile]}>
            {/* Switcher deslizante superior con pill animada */}
            <View style={styles.tabTrack}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    transform: [{ translateX: tabPillX }],
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Formulario de iniciar sesión"
                style={styles.tabBtn}
                onPress={() => switchMode('login')}
              >
                <Text style={[styles.tabBtnText, mode === 'login' && styles.tabBtnTextActive]}>
                  Iniciar sesión
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Formulario de registro"
                style={styles.tabBtn}
                onPress={() => switchMode('register')}
              >
                <Text style={[styles.tabBtnText, mode === 'register' && styles.tabBtnTextActive]}>
                  Crear cuenta
                </Text>
              </Pressable>
            </View>

            {/* Cabecera del formulario */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {mode === 'login' ? '¡Bienvenido de vuelta!' : 'Creá tu cuenta gratis'}
              </Text>
              <Text style={styles.formSubtitle}>
                {mode === 'login'
                  ? 'Ingresá tus credenciales para acceder a tus tareas.'
                  : 'Completá los datos y empezá a gestionar tus proyectos hoy.'}
              </Text>
            </View>

            {/* Mensajes de feedback */}
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

            {/* Formulario con Slide Suave */}
            <Animated.View
              style={[
                styles.formFields,
                {
                  opacity: contentFadeAnim,
                  transform: [{ translateX: formSlideX }],
                },
              ]}
            >
              {mode === 'register' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre completo</Text>
                  <TextInput
                    testID="register-name-input"
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej. Alex Turner"
                    placeholderTextColor={colors.placeholder}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={[
                      styles.textInput,
                      focusedField === 'name' && styles.textInputFocused,
                    ]}
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <TextInput
                  testID="auth-email-input"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nombre@ejemplo.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.textInput,
                    focusedField === 'email' && styles.textInputFocused,
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Contraseña</Text>
                  {mode === 'login' ? (
                    <Pressable
                      onPress={() => alert('Ingresá cualquier contraseña en esta demo.')}
                      style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}
                    >
                      <Text style={styles.inlineLink}>¿Olvidaste tu clave?</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextInput
                  testID="auth-password-input"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.textInput,
                    focusedField === 'password' && styles.textInputFocused,
                  ]}
                />
              </View>

              {mode === 'register' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                  <TextInput
                    testID="register-confirm-password-input"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repetí tu contraseña"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    style={[
                      styles.textInput,
                      focusedField === 'confirm' && styles.textInputFocused,
                    ]}
                  />
                </View>
              ) : null}

              {/* Botón Principal Violeta (#5B3FD9) con oscurecimiento en hover/pressed */}
              <Pressable
                testID="auth-submit-button"
                accessibilityRole="button"
                accessibilityLabel={mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                onPress={handleSubmit}
                // @ts-ignore soporte hover web
                onHoverIn={() => setBtnHovered(true)}
                // @ts-ignore
                onHoverOut={() => setBtnHovered(false)}
                style={({ pressed }) => [
                  styles.submitButton,
                  (btnHovered || pressed) && styles.submitButtonDarker,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Ingresar a Taskify' : 'Crear mi cuenta'}
                </Text>
              </Pressable>

              {/* Alternar entre Login y Register */}
              <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>
                  {mode === 'login' ? '¿Aún no tenés una cuenta?' : '¿Ya tenés una cuenta?'}
                </Text>
                <Pressable
                  onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  // @ts-ignore
                  onHoverIn={() => setLinkHovered(true)}
                  // @ts-ignore
                  onHoverOut={() => setLinkHovered(false)}
                  style={({ pressed }) => [
                    styles.linkWrap,
                    (linkHovered || pressed) && styles.linkHovered,
                  ]}
                >
                  <Text style={[styles.mainLink, (linkHovered) && styles.mainLinkDarker]}>
                    {mode === 'login' ? 'Registrate acá' : 'Iniciá sesión'}
                  </Text>
                </Pressable>
              </View>

              {/* Acceso rápido / Demo */}
              <View style={styles.guestDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o probá sin cuenta</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                testID="auth-guest-button"
                accessibilityRole="button"
                onPress={() => {
                  onContinueAsGuest ? onContinueAsGuest() : onSuccess?.();
                }}
                // @ts-ignore
                onHoverIn={() => setGuestHovered(true)}
                // @ts-ignore
                onHoverOut={() => setGuestHovered(false)}
                style={({ pressed }) => [
                  styles.guestButton,
                  (guestHovered || pressed) && styles.guestButtonActive,
                ]}
              >
                <Text style={styles.guestButtonText}>Continuar al gestor de tareas →</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bg, // #FAF8FF lavanda casi blanco
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContainerLarge: {
    padding: 32,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.indigoDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContainerRow: {
    flexDirection: 'row',
    minHeight: 620,
  },
  cardContainerColumn: {
    flexDirection: 'column',
  },

  // ================= PANEL IZQUIERDO =================
  leftPanel: {
    backgroundColor: colors.indigoDeep, // #1E1B4B índigo profundo
    padding: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  leftPanelWide: {
    width: '45%',
    justifyContent: 'space-between',
  },
  leftPanelMobile: {
    width: '100%',
    padding: 24,
  },
  glowCircleOne: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(91, 63, 217, 0.25)', // halo violeta
  },
  glowCircleTwo: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 162, 127, 0.12)', // halo durazno/coral
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 162, 127, 0.2)', // cápsula traslúcida coral
    borderWidth: 1.5,
    borderColor: colors.accentCoral, // #FFA27F
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCheck: {
    color: colors.accentCoral, // #FFA27F tilde coral
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  brandName: {
    color: colors.onDark,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  motivationBox: {
    flex: 1,
    justifyContent: 'center',
  },
  taglineChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 162, 127, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  taglineChipText: {
    color: colors.accentCoral, // #FFA27F
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  motivationHeading: {
    color: colors.onDark,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 33,
    marginBottom: 12,
  },
  motivationLead: {
    color: colors.onDarkMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 26,
  },
  benefitList: {
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 162, 127, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkIcon: {
    color: colors.accentCoral, // #FFA27F tildes durazno/coral
    fontSize: 14,
    fontWeight: '900',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    color: colors.onDark,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  benefitDesc: {
    color: colors.onDarkMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  quoteBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    marginTop: 6,
  },
  quoteText: {
    color: colors.accentCoral, // #FFA27F
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // ================= PANEL DERECHO / FORMULARIO =================
  formPanel: {
    backgroundColor: colors.bg, // #FAF8FF lavanda casi blanco
    padding: 36,
  },
  formPanelWide: {
    width: '55%',
    justifyContent: 'center',
  },
  formPanelMobile: {
    width: '100%',
    padding: 24,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#EBE6FA',
    padding: 4,
    borderRadius: radius.md,
    position: 'relative',
    marginBottom: 28,
    alignSelf: 'flex-start',
    width: 290,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 140,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    shadowColor: colors.indigoDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtn: {
    width: 140,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary, // #5B3FD9
    fontWeight: '900',
  },
  formHeader: {
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  errorAlert: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorAlertText: {
    color: colors.dangerDark,
    fontSize: 13,
    fontWeight: '700',
  },
  successAlert: {
    backgroundColor: colors.successSoft,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successAlertText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  formFields: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.bodyText,
    marginBottom: 6,
  },
  textInput: {
    minHeight: TOUCH,
    backgroundColor: colors.surface, // blanco puro
    borderWidth: 1.5,
    borderColor: colors.inputBorder, // borde violeta suave #DDD6FE
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
  },
  textInputFocused: {
    borderColor: colors.primary, // #5B3FD9 violeta al enfocar
    backgroundColor: colors.surface,
  },
  linkWrap: {
    paddingVertical: 2,
  },
  inlineLink: {
    color: colors.primary, // #5B3FD9
    fontSize: 12,
    fontWeight: '700',
  },
  linkPressed: {
    opacity: 0.65,
  },
  submitButton: {
    minHeight: TOUCH,
    backgroundColor: colors.primary, // #5B3FD9 violeta
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDarker: {
    backgroundColor: colors.primaryDark, // #482EC0 oscurecido al pasar el mouse / presionar
  },
  submitButtonText: {
    color: '#FFFFFF', // blanco con alto contraste
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  switchPrompt: {
    fontSize: 13,
    color: colors.textMuted,
  },
  mainLink: {
    color: colors.primary, // #5B3FD9
    fontSize: 13,
    fontWeight: '800',
  },
  mainLinkDarker: {
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  linkHovered: {
    opacity: 0.9,
  },
  guestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: '700',
  },
  guestButton: {
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonActive: {
    backgroundColor: colors.neutralSoft,
    borderColor: colors.inputBorder,
  },
  guestButtonText: {
    color: colors.primary, // #5B3FD9
    fontSize: 13,
    fontWeight: '800',
  },
});
