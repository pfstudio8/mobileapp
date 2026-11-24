import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../../src/components/Typo';
import { TaskCard } from '../../src/components/TaskCard';
import { StatusTabs } from '../../src/components/StatusTabs';
import {
  fetchTasks,
  createRemoteTask,
  updateRemoteTaskStatus,
  deleteRemoteTask,
} from '../../src/services/taskService';
import type { Task, TaskStatus } from '../../src/types/task';
import { filterTasks } from '../../src/utils/taskFilters';
import { isValidTaskTitle } from '../../src/utils/taskValidation';
import { colors, radius, TOUCH, BRAND } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';

type Feedback = { text: string; tone: 'success' | 'error' } | null;

export default function TaskManagerScreen() {
  let user: { name?: string } | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    user = auth.user;
  } catch {
    // En tests unitarios sin AuthProvider
  }
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todas');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const nextId = useRef(100);

  async function loadTasks(simulateFailure = false) {
    setLoading(true);
    setError(null);
    try {
      const records = await fetchTasks(simulateFailure);
      setTasks(records);
    } catch (caught) {
      console.error('[taskService] No se cargaron las tareas', caught);
      const message =
        caught instanceof Error && caught.message
          ? caught.message
          : 'No pudimos cargar las tareas. Verificá tu conexión e intentá nuevamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const visibleTasks = useMemo(() => filterTasks(tasks, query, status), [tasks, query, status]);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  function toggleTask(id: string) {
    const current = tasks.find((t) => t.id === id);
    const nextCompleted = current ? !current.completed : true;
    setTasks((previous) =>
      previous.map((task) => (task.id === id ? { ...task, completed: nextCompleted } : task)),
    );
    if (process.env.NODE_ENV !== 'test') {
      void updateRemoteTaskStatus(id, nextCompleted).catch((err) => {
        console.warn('[toggleTask] No se pudo sincronizar estado con el backend:', err);
      });
    }
  }

  function addTask() {
    if (!isValidTaskTitle(newTitle)) {
      setFeedback({ text: 'Ingresá un nombre válido para continuar.', tone: 'error' });
      return;
    }
    const cleanTitle = newTitle.trim();
    const tempId = `nuevo-${nextId.current++}`;
    const task: Task = {
      id: tempId,
      title: cleanTitle,
      description: '',
      priority: 'media',
      completed: false,
    };
    setTasks((previous) => [task, ...previous]);
    setNewTitle('');
    setFeedback({ text: 'Tarea agregada.', tone: 'success' });
    Keyboard.dismiss();

    if (process.env.NODE_ENV !== 'test') {
      void createRemoteTask(cleanTitle)
        .then((created) => {
          setTasks((previous) =>
            previous.map((item) => (item.id === tempId ? created : item)),
          );
        })
        .catch((err) => {
          console.warn('[addTask] No se pudo guardar en el backend:', err);
        });
    }
  }

  function deleteTask(id: string) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    setFeedback({ text: 'Tarea eliminada.', tone: 'success' });
    if (process.env.NODE_ENV !== 'test') {
      void deleteRemoteTask(id).catch((err) => {
        console.warn('[deleteTask] No se pudo eliminar en el backend:', err);
      });
    }
  }

  const hasFilters = query.trim().length > 0 || status !== 'todas';

  function renderEmpty() {
    if (loading) return null;
    if (error && total === 0) return null;
    if (total === 0) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>Todavía no hay tareas</Text>
          <Text style={styles.emptyText}>Agregá la primera con el campo de arriba o el botón «+ Nueva».</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Sin resultados</Text>
        <Text style={styles.emptyText}>No hay tareas que coincidan con estos filtros.</Text>
        {hasFilters ? (
          <Pressable
            accessibilityRole="button"
            style={styles.linkButton}
            onPress={() => {
              setQuery('');
              setStatus('todas');
            }}
          >
            <Text style={styles.linkText}>Limpiar filtros</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={loading ? [] : visibleTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggle={() => toggleTask(item.id)}
              onDelete={() => deleteTask(item.id)}
            />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={loading}
          onRefresh={() => void loadTasks()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <>
              {/* Barra superior con navegación de pantallas */}
              <View style={styles.eyebrowRow}>
                <Text style={styles.eyebrow}>{BRAND.tagline.toUpperCase()}</Text>
                <View style={styles.headerButtonsRow}>
                  <Pressable
                    testID="new-task-nav-button"
                    accessibilityRole="button"
                    accessibilityLabel="Crear nueva tarea"
                    onPress={() => router.push('/(app)/new' as any)}
                    style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.newBtnText}>+ Nueva</Text>
                  </Pressable>
                  <Pressable
                    testID="auth-profile-button"
                    accessibilityRole="button"
                    accessibilityLabel="Ver perfil y sesión"
                    onPress={() => router.push('/(app)/profile' as any)}
                    style={({ pressed }) => [styles.accountButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.accountText}>Perfil 👤</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Abrir guía de trabajo"
                    onPress={() => router.push('/guia')}
                    style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.helpText}>Guía ↗</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.brandRow}>
                <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Text style={styles.logoMark}>✓</Text>
                </View>
                <View>
                  <Text accessibilityRole="header" style={styles.heading}>{BRAND.name}</Text>
                  {user?.name ? (
                    <Text style={styles.userGreeting}>Hola, {user.name} 👋</Text>
                  ) : null}
                </View>
              </View>

              <Text style={styles.subtitle}>
                {total === 0
                  ? 'Organizá tu trabajo y seguí tu avance.'
                  : pending === 0
                    ? '¡Todo listo! Completaste todas tus tareas.'
                    : `Te ${pending === 1 ? 'queda' : 'quedan'} ${pending} ${pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}.`}
              </Text>

              {/* Tarjeta de Progreso */}
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <Text style={styles.progressLabel}>PROGRESO</Text>
                  <Text style={styles.progressValue}>{progress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{total}</Text>
                    <Text style={styles.statLabel}>TOTALES</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{completed}</Text>
                    <Text style={styles.statLabel}>COMPLETADAS</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{pending}</Text>
                    <Text style={styles.statLabel}>PENDIENTES</Text>
                  </View>
                </View>
              </View>

              {/* Alta rápida de tarea */}
              <Text style={styles.label}>NUEVA TAREA RÁPIDA</Text>
              <View style={styles.addRow}>
                <TextInput
                  testID="new-task-input"
                  accessibilityLabel="Nombre de la nueva tarea"
                  placeholder="Ej.: Revisar documentación"
                  placeholderTextColor={colors.placeholder}
                  value={newTitle}
                  onChangeText={(text) => {
                    setNewTitle(text);
                    if (feedback) setFeedback(null);
                  }}
                  onSubmitEditing={addTask}
                  returnKeyType="done"
                  style={[styles.addInput, feedback?.tone === 'error' && styles.inputError]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Agregar tarea"
                  testID="add-task-button"
                  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                  onPress={addTask}
                >
                  <Text style={styles.addButtonText}>Agregar</Text>
                </Pressable>
              </View>
              {feedback ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.feedback, feedback.tone === 'error' ? styles.feedbackError : styles.feedbackOk]}
                >
                  {feedback.text}
                </Text>
              ) : null}

              {/* Buscador reactivo */}
              <Text style={[styles.label, styles.sectionHeading]}>FILTRAR TAREAS</Text>
              <View style={styles.searchWrap}>
                <TextInput
                  testID="search-input"
                  accessibilityLabel="Buscar tareas por nombre"
                  placeholder="Buscar por nombre..."
                  placeholderTextColor={colors.placeholder}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  style={styles.searchInput}
                />
                {query.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpiar campo de búsqueda"
                    onPress={() => setQuery('')}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearText}>✕</Text>
                  </Pressable>
                ) : null}
              </View>

              <StatusTabs
                current={status}
                onChange={setStatus}
                counts={{ todas: total, pendientes: pending, completadas: completed }}
              />

              {/* Botones de control y simulación de error */}
              <View style={styles.actions}>
                <Pressable
                  testID="retry-button"
                  accessibilityRole="button"
                  accessibilityLabel="Recargar lista de tareas"
                  onPress={() => void loadTasks()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryLabel}>↻ Recargar</Text>
                </Pressable>
                <Pressable
                  testID="simulate-error-button"
                  accessibilityRole="button"
                  accessibilityLabel="Simular error de API"
                  onPress={() => void loadTasks(true)}
                  style={styles.simulateButton}
                >
                  <Text style={styles.simulateLabel}>⚠ Simular error API</Text>
                </Pressable>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Error al cargar</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reintentar carga de tareas"
                    onPress={() => void loadTasks()}
                    style={styles.errorRetry}
                  >
                    <Text style={styles.errorRetryText}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingLabel}>Consultando tareas…</Text>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={renderEmpty()}
          ListFooterComponent={
            <Text style={styles.footer}>EDI · Desarrollo de Software Multiplataforma · Auditoría técnica</Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  listContainer: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 60, flexGrow: 1 },
  pressed: { opacity: 0.6 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '800', color: colors.primary },
  headerButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  newBtnText: { fontWeight: '900', color: '#FFFFFF', fontSize: 12 },
  accountButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  accountText: { fontWeight: '800', color: colors.primary, fontSize: 12 },
  helpButton: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  helpText: { fontWeight: '800', color: colors.primaryDark, fontSize: 12 },
  heading: { fontSize: 32, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  userGreeting: { fontSize: 13, fontWeight: '700', color: colors.accentCoral, marginTop: -2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoMark: { color: colors.onDark, fontSize: 22, fontWeight: '900', marginTop: -1 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 21 },

  progressCard: { backgroundColor: colors.dark, borderRadius: radius.lg, padding: 16, marginBottom: 24 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressLabel: { color: colors.onDarkMuted, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  progressValue: { color: '#FFFFFF', fontWeight: '700', fontSize: 30, letterSpacing: -0.5 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.onDarkTrack, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  stat: { flex: 1, backgroundColor: colors.onDarkChip, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12 },
  statNumber: { color: '#FFFFFF', fontWeight: '800', fontSize: 24 },
  statLabel: { color: colors.onDarkMuted, fontWeight: '600', fontSize: 10.5, letterSpacing: 0.8, marginTop: 2 },

  label: { fontSize: 12, color: colors.bodyText, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  sectionHeading: { marginTop: 14 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addInput: { flex: 1, minHeight: TOUCH, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: radius.md, paddingHorizontal: 14, color: colors.text, fontSize: 15, minWidth: 0 },
  inputError: { borderColor: colors.danger },
  addButton: { minHeight: TOUCH, backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  addButtonPressed: { backgroundColor: colors.primaryDark },
  addButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  feedback: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
  feedbackOk: { color: colors.success },
  feedbackError: { color: colors.danger },

  searchWrap: { justifyContent: 'center', marginBottom: 12 },
  searchInput: { minHeight: TOUCH, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: radius.md, paddingLeft: 14, paddingRight: 44, color: colors.text, fontSize: 15 },
  clearButton: { position: 'absolute', right: 6, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.textMuted, fontSize: 15, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  retryButton: { minHeight: 44, paddingHorizontal: 10, backgroundColor: colors.primarySoft, borderRadius: radius.sm, flex: 1, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { fontSize: 12, color: colors.primaryDark, fontWeight: '800' },
  simulateButton: { minHeight: 44, paddingHorizontal: 10, backgroundColor: colors.dangerSoft, borderRadius: radius.sm, flex: 1, alignItems: 'center', justifyContent: 'center' },
  simulateLabel: { fontSize: 12, color: colors.danger, fontWeight: '800' },

  errorBox: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.danger },
  errorTitle: { color: colors.danger, fontWeight: '800', fontSize: 14 },
  errorText: { color: colors.dangerDark, fontSize: 13, marginTop: 4, lineHeight: 19 },
  errorRetry: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.danger, borderRadius: radius.sm },
  errorRetryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  loading: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, gap: 10 },
  loadingLabel: { color: colors.textMuted, fontSize: 13 },

  emptyBox: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { marginTop: 10, color: colors.text, fontSize: 16, fontWeight: '800' },
  emptyText: { marginTop: 6, textAlign: 'center', color: colors.textMuted, lineHeight: 20, fontSize: 13 },
  linkButton: { marginTop: 14, minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' },
  linkText: { color: colors.primary, fontWeight: '800', fontSize: 14 },

  footer: { textAlign: 'center', color: colors.textFaint, fontSize: 11, paddingTop: 30 },
});
