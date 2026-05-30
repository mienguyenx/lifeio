import { Stack } from 'expo-router';
import JournalScreen from '../(tabs)/journal';

export default function JournalScreenWrapper() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nhật ký' }} />
      <JournalScreen />
    </>
  );
}
