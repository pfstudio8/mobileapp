import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../src/components/Typo';
import { colors, radius, TOUCH } from '../../src/theme';
import type { TaskPriority } from '../../src/types/task';
import { isValidTaskTitle } from '../../src/utils/taskValidation';
import { createRemoteTask } from '../../src/services/taskService';

export default function NewTaskScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!isValidTaskTitle(title)) {
      setError('Por favor ingresá un título válido (mínimo 3 caracteres).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createRemoteTask(title.trim(), description.trim(), priority);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea.');
    } finally {
      setLoading(false);
    }
  }

  const priorityOptions: { key: TaskPriority; label: string; color: string }[] = [
    { key: 'alta', label: 'Alta', color: colors.danger },
    { key: 'media', label: 'Media', color: colors.accentCoral },
    { key: 'baja', label: 'Baja', color: colors.olive },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al listado"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>

          <Text style={styles.heading}>Nueva Tarea</Text>
          <Text style={styles.subtitle}>Completá los datos para organizar tu objetivo.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Título de la tarea *</Text>
            <TextInput
              testID="new-task-title"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
              placeholder="Ej.: Estudiar para el examen de React Native"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Descripción / Notas</Text>
            <TextInput
              testID="new-task-description"
              value={description}
              onChangeText={setDescription}
              placeholder="Detalles opcionales..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.multilineInput]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setPriority(opt.key)}
                    style={[
                      styles.priorityBtn,
                      isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && { color: opt.color, fontWeight: '900' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            testID="save-task-button"
            accessibilityRole="button"
            accessibilityLabel="Guardar tarea"
            disabled={loading}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              loading && styles.saveBtnDisabled,
            ]}
          >
            <Text style={styles.saveBtnText}>
              {loading ? 'Guardando...' : 'Crear tarea'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 22, paddingBottom: 50 },
  backButton: { paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  heading: { fontSize: 28, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.dangerDark, fontWeight: '700', fontSize: 13 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: colors.bodyText, marginBottom: 8 },
  input: {
    minHeight: TOUCH,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  saveBtn: {
    minHeight: TOUCH,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnPressed: { backgroundColor: colors.primaryDark },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
