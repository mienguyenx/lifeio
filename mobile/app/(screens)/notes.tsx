import { Stack } from 'expo-router';
import NotesScreen from '../(tabs)/notes';

export default function NotesScreenWrapper() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ghi chú' }} />
      <NotesScreen />
    </>
  );
}
