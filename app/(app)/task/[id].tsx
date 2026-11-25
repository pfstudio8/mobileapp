import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, TOUCH, priorityStyle } from '../../../src/theme';
import type { Task, TaskPriority } from '../../../src/types/task';
import {
  getRemoteTaskById,
  updateRemoteTask,
  updateRemoteTaskStatus,
  archiveRemoteTask,
  unarchiveRemoteTask,
  deleteRemoteTask,
} from '../../../src/services/taskService';

const PRIORITY_OPTIONS: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'alta', label: 'Alta', color: colors.danger },
  { key: 'media', label: 'Media', color: colors.accentCoral },
  { key: 'baja', label: 'Baja', color: colors.olive },
];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de edición
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');

  async function loadTaskDetail() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await getRemoteTaskById(id);
      setTask(found);
      setTitle(found.title);
      setDescription(found.description);
      setPriority(found.priority);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el detalle.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTaskDetail();
  }, [id]);

  async function handleToggleStatus() {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateRemoteTaskStatus(task.id, !task.completed);
      setTask(updated);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado de la tarea.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!task || !title.trim()) return;
    setSaving(true);
    try {
      const updated = await updateRemoteTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      setTask(updated);
      setTitle(updated.title);
      setDescription(updated.description);
      setPriority(updated.priority);
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios en el servidor.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleArchive() {
    if (!task) return;
    setSaving(true);
    try {
      const updated = task.archived
        ? await unarchiveRemoteTask(task.id)
        : await archiveRemoteTask(task.id);
      setTask(updated);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el archivo de la tarea.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;

    const performDelete = async () => {
      try {
        await deleteRemoteTask(task.id);
        router.back();
      } catch {
        Alert.alert('Error', 'No se pudo eliminar la tarea.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que querés eliminar esta tarea?')) {
        void performDelete();
      }
    } else {
      Alert.alert('Eliminar tarea', '¿Estás seguro de que deseás eliminar esta tarea?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void performDelete() },
      ]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Cargando detalle de la tarea...</Text>
      </SafeAreaView>
    );
  }

  if (error || !task) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Text style={styles.errorHeading}>⚠️ Tarea no encontrada</Text>
        <Text style={styles.centerText}>{error || 'El identificador no existe en el registro.'}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.actionBtn}
        >
          <Text style={styles.actionBtnText}>← Volver al gestor</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const priorityConf = priorityStyle[task.priority];
  const isArchived = Boolean(task.archived);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al gestor de tareas"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>

          <View style={styles.headerRow}>
            <View style={[styles.priorityPill, { backgroundColor: priorityConf.bg }]}>
              <Text style={[styles.priorityPillText, { color: priorityConf.fg }]}>
                {priorityConf.label}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleToggleStatus}
              disabled={saving}
              style={[
                styles.statusBadge,
                task.completed ? styles.statusDone : styles.statusPending,
              ]}
            >
              <Text style={[styles.statusText, task.completed && styles.statusTextDone]}>
                {task.completed ? '✓ Completada' : '○ Pendiente'}
              </Text>
            </Pressable>
            {isArchived ? (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>📦 Archivada</Text>
              </View>
            ) : null}
          </View>

          {isEditing ? (
            <View style={styles.editCard}>
              <Text style={styles.fieldLabel}>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Título de la tarea"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Descripción</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción..."
                multiline
                numberOfLines={4}
                style={[styles.textInput, styles.multilineInput]}
              />

              <Text style={styles.fieldLabel}>Prioridad</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((opt) => {
                  const selected = priority === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setPriority(opt.key)}
                      style={[
                        styles.priorityBtn,
                        selected && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBtnText,
                          selected && { color: opt.color, fontWeight: '900' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setTitle(task.title);
                    setDescription(task.description);
                    setPriority(task.priority);
                    setIsEditing(false);
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSaveEdit}
                  disabled={saving}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.detailCard}>
              <Text style={[styles.title, task.completed && styles.titleCompleted]}>
                {task.title}
              </Text>
              <Text style={styles.description}>
                {task.description || 'Sin descripción adicional.'}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsEditing(true)}
                  style={styles.editActionBtn}
                >
                  <Text style={styles.editActionText}>✏️ Editar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={handleToggleArchive}
                  style={styles.archiveActionBtn}
                >
                  <Text style={styles.archiveActionText}>
                    {isArchived ? '↩ Desarchivar' : '📦 Archivar'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDelete}
                  style={styles.deleteActionBtn}
                >
                  <Text style={styles.deleteActionText}>🗑️ Eliminar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  centerScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerText: { marginTop: 12, color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  errorHeading: { fontSize: 20, fontWeight: '900', color: colors.danger, marginBottom: 8 },
  actionBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800' },
  container: { padding: 22, paddingBottom: 50 },
  backButton: { paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 14 },
  backText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  priorityPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.sm },
  priorityPillText: { fontSize: 12, fontWeight: '800' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1.5 },
  statusPending: { borderColor: colors.border, backgroundColor: colors.surface },
  statusDone: { borderColor: colors.success, backgroundColor: colors.successSoft },
  statusText: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  statusTextDone: { color: colors.success },
  archivedBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.warningSoft,
  },
  archivedBadgeText: { fontSize: 12, fontWeight: '800', color: colors.warning },
  detailCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.indigoDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 14, lineHeight: 30 },
  titleCompleted: { textDecorationLine: 'line-through', color: colors.textFaint },
  description: { fontSize: 15, color: colors.bodyText, lineHeight: 24, marginBottom: 26 },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 18,
  },
  editActionBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActionText: { color: colors.primaryDark, fontWeight: '800', fontSize: 13 },
  archiveActionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archiveActionText: { color: colors.bodyText, fontWeight: '800', fontSize: 13 },
  deleteActionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: { color: colors.danger, fontWeight: '800', fontSize: 13 },
  editCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: colors.bodyText, marginBottom: 6, marginTop: 12 },
  textInput: {
    minHeight: TOUCH,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  multilineInput: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  priorityBtn: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityBtnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: colors.textMuted, fontWeight: '800' },
  saveBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '900' },
});
