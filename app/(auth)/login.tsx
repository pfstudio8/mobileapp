import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AuthScreen } from '../../src/components/AuthScreen';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginRoute() {
  const { continueAsGuest } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <AuthScreen
        onSuccess={() => {
          router.replace('/(app)' as any);
        }}
        onContinueAsGuest={() => {
          continueAsGuest();
          router.replace('/(app)' as any);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0C18',
  },
});
