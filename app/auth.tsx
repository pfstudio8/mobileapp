import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AuthScreen } from '../src/components/AuthScreen';

export default function AuthRoute() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <AuthScreen
        onSuccess={() => router.replace('/')}
        onContinueAsGuest={() => router.replace('/')}
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
