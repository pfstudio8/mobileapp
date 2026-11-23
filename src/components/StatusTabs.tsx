import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TaskStatus } from '../types/task';
import { colors, radius } from '../theme';

const options: { key: TaskStatus; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'completadas', label: 'Completadas' },
];

type Props = {
  current: TaskStatus;
  onChange: (status: TaskStatus) => void;
  counts?: Partial<Record<TaskStatus, number>>;
};

export function StatusTabs({ current, onChange, counts }: Props) {
  return (
    <View style={styles.container}>
      {options.map((item) => {
        const active = current === item.key;
        const count = counts?.[item.key];
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={count === undefined ? item.label : `${item.label}, ${count}`}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.button, active && styles.active, pressed && !active && styles.pressed]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
            {count === undefined ? null : (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutralSoft,
    padding: 4,
    borderRadius: radius.md,
    gap: 4,
    marginBottom: 14,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: {
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: colors.dark,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  pressed: { backgroundColor: colors.neutralPressed },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  textActive: { color: colors.dark },
  badge: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, backgroundColor: colors.neutralChip, alignItems: 'center' },
  badgeActive: { backgroundColor: colors.primarySoft },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  badgeTextActive: { color: colors.primaryDark },
});
