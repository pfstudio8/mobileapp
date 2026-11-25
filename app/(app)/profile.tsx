import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/Typo';
import { colors, radius, TOUCH } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { API_URL } from '../../src/config/api';

export default function ProfileScreen() {
  const { user, token, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/login' as any);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al gestor"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>

        <Text style={styles.heading}>Perfil y Sesión</Text>
        <Text style={styles.subtitle}>Información del usuario y conectividad del entorno.</Text>

        {/* Tarjeta de usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Facundo Esquivel'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'facundo@instituto.edu.ar'}</Text>
            <View style={styles.badgeAuth}>
              <Text style={styles.badgeAuthText}>✓ Sesión activa (SecureStore)</Text>
            </View>
          </View>
        </View>

        {/* Diagnóstico técnico del entorno (Fase 6) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Diagnóstico de Conectividad</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>URL de API activa:</Text>
            <Text style={styles.infoVal}>{API_URL}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Token en memoria:</Text>
            <Text style={styles.infoVal}>{token ? `${token.substring(0, 16)}...` : 'Ninguno'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Almacenamiento seguro:</Text>
            <Text style={styles.infoVal}>expo-secure-store (Hardware Keystore)</Text>
          </View>
        </View>

        {/* Botón de Ayuda / Guía */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/guia')}
          style={styles.guideBtn}
        >
          <Text style={styles.guideBtnText}>📖 Abrir Guía de Trabajo y Misiones ↗</Text>
        </Pressable>

        {/* Botón de Cerrar Sesión */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión actual"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        >
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 22, paddingBottom: 50 },
  backButton: { paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 14 },
  backText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  heading: { fontSize: 28, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.indigoDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.accentCoral, fontSize: 24, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  badgeAuth: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeAuthText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.bodyText, marginBottom: 14 },
  infoRow: { marginBottom: 12 },
  infoKey: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: '600', color: colors.text },
  guideBtn: {
    minHeight: 46,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideBtnText: { color: colors.primaryDark, fontWeight: '800', fontSize: 14 },
  logoutBtn: {
    minHeight: TOUCH,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoutBtnPressed: { backgroundColor: colors.danger, opacity: 0.9 },
  logoutBtnText: { color: colors.danger, fontWeight: '900', fontSize: 15 },
});
