import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Typo';
import type { Task } from '../types/task';
import { colors, priorityStyle, radius } from '../theme';

type TaskCardProps = {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onOpenDetail?: () => void;
};

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onArchive,
  onUnarchive,
  onOpenDetail,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const priority = priorityStyle[task.priority];
  const isArchived = Boolean(task.archived);

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: task.completed ? colors.border : priority.bar }]} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Pressable
            testID={`toggle-${task.id}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            accessibilityLabel={`Cambiar estado de ${task.title}`}
            hitSlop={10}
            style={({ pressed }) => [styles.check, task.completed && styles.checked, pressed && styles.pressed]}
            onPress={onToggle}
          >
            <Text style={styles.checkText}>{task.completed ? '✓' : ''}</Text>
          </Pressable>
          <View style={styles.content}>
            <Text style={[styles.title, task.completed && styles.completed]}>{task.title}</Text>
            <View style={styles.row}>
              <View style={[styles.pill, { backgroundColor: priority.bg }]}>
                <Text style={[styles.pillText, { color: priority.fg }]}>{priority.label}</Text>
              </View>
              <View style={[styles.pill, task.completed ? styles.pillDone : styles.pillPending]}>
                <Text style={[styles.pillText, { color: task.completed ? colors.success : colors.textMuted }]}>
                  {task.completed ? 'Completada' : 'Pendiente'}
                </Text>
              </View>
              {isArchived ? (
                <View style={[styles.pill, styles.pillArchived]}>
                  <Text style={[styles.pillText, styles.pillArchivedText]}>Archivada</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            testID={`expand-${task.id}`}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`Ver detalle de ${task.title}`}
            hitSlop={8}
            onPress={() => setExpanded((current) => !current)}
            style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
          >
            <Text style={styles.expandText}>{expanded ? '−' : '+'}</Text>
          </Pressable>
        </View>
        {expanded ? (
          <View style={styles.details} testID={`details-${task.id}`}>
            <Text style={styles.description}>
              {task.description || 'Sin descripción adicional.'}
            </Text>
            <View style={styles.actionsRow}>
              {onOpenDetail ? (
                <Pressable
                  testID={`edit-${task.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar ${task.title}`}
                  onPress={onOpenDetail}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                >
                  <Text style={styles.editText}>✏️ Editar</Text>
                </Pressable>
              ) : null}
              {!isArchived && onArchive ? (
                <Pressable
                  testID={`archive-${task.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Archivar ${task.title}`}
                  onPress={onArchive}
                  style={({ pressed }) => [styles.archiveButton, pressed && styles.pressed]}
                >
                  <Text style={styles.archiveText}>📦 Archivar</Text>
                </Pressable>
              ) : null}
              {isArchived && onUnarchive ? (
                <Pressable
                  testID={`unarchive-${task.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Desarchivar ${task.title}`}
                  onPress={onUnarchive}
                  style={({ pressed }) => [styles.archiveButton, pressed && styles.pressed]}
                >
                  <Text style={styles.archiveText}>↩ Desarchivar</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${task.title}`}
                onPress={onDelete}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              >
                <Text style={styles.deleteText}>Eliminar tarea</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  accent: { width: 5 },
  body: { flex: 1, padding: 14 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    height: 28,
    width: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.checkBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  pressed: { opacity: 0.6 },
  content: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  completed: { color: colors.textFaint, textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillPending: { backgroundColor: colors.neutralSoft },
  pillDone: { backgroundColor: colors.successSoft },
  pillArchived: { backgroundColor: colors.warningSoft },
  pillArchivedText: { color: colors.warning },
  pillText: { fontSize: 11, fontWeight: '700' },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.neutralSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandText: { color: colors.primaryDark, fontWeight: '800', fontSize: 20 },
  details: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  description: { fontSize: 14, color: colors.bodyText, lineHeight: 21 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
  },
  editText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  archiveButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.sm,
  },
  archiveText: { color: colors.bodyText, fontSize: 13, fontWeight: '800' },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
  },
  deleteText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
});
