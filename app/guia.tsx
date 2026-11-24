import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/Typo';
import { colors } from '../src/theme';

const missions = [
  'Reproducir los errores antes de cambiar el código.',
  'Examinar las variables con DevTools, consola o breakpoints.',
  'Corregir al menos cuatro incidencias con cambios mínimos.',
  'Ejecutar pruebas automatizadas y explicar sus resultados.',
  'Documentar causa raíz, corrección y prueba de regresión.',
  'Crear un commit con los cambios y defender las decisiones.',
];

export default function GuiaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Volver al gestor</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GUÍA DE TRABAJO</Text>
        <Text style={styles.title}>Investigar antes de corregir</Text>
        <Text style={styles.intro}>
          No se trata de encontrar el código correcto en Internet, sino de demostrar
          cómo se detecta una falla, cómo se explica y cómo se evita que reaparezca.
        </Text>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Misión de la clase</Text>
          <Text style={styles.calloutText}>Corregir al menos 4 fallos y entregar un informe técnico verificable.</Text>
        </View>
        {missions.map((mission, index) => (
          <View key={mission} style={styles.mission}>
            <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.missionText}>{mission}</Text>
          </View>
        ))}
        <Text style={styles.note}>Usá la plantilla INFORME_INCIDENTES.md del proyecto para registrar las evidencias.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 35, paddingTop: 14 },
  back: { paddingVertical: 10, marginBottom: 20 },
  backText: { color: colors.primary, fontWeight: '800' },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, color: colors.primary, fontWeight: '900' },
  title: { fontSize: 29, color: colors.text, fontWeight: '900', marginTop: 10, lineHeight: 35 },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 23, marginTop: 13, marginBottom: 22 },
  callout: { backgroundColor: colors.dark, borderRadius: 16, padding: 18, marginBottom: 20 },
  calloutTitle: { fontSize: 15, fontWeight: '900', color: colors.onDark },
  calloutText: { marginTop: 7, color: colors.onDarkMuted, lineHeight: 20 },
  mission: { flexDirection: 'row', backgroundColor: colors.surface, padding: 16, borderRadius: 13, gap: 14, marginBottom: 9, borderWidth: 1, borderColor: colors.border },
  number: { color: colors.primary, fontWeight: '900' },
  missionText: { flex: 1, color: colors.bodyText, lineHeight: 20, fontSize: 13 },
  note: { marginTop: 22, color: colors.textMuted, fontStyle: 'italic', lineHeight: 19 },
});
