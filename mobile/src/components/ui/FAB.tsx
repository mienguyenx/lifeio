import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FABProps {
  onPress: () => void;
  onLongPress?: () => void;
  icon?: string;
  color?: string;
}

export function FAB({ onPress, onLongPress, icon = '+', color = '#8b5cf6' }: FABProps) {
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} delayLongPress={500} style={[styles.fab, { backgroundColor: color, shadowColor: color }]} activeOpacity={0.8}>
      <Text style={styles.fabText}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: 'white', fontSize: 28, lineHeight: 32 },
});
