import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
  icon?: string;
}

export function StatCard({ label, value, sub, valueColor, icon }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.value, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      </View>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16 },
  label: { color: '#a0a0a0', fontSize: 12, marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 18 },
  value: { color: '#f8f8f8', fontSize: 24, fontWeight: 'bold' },
  sub: { color: '#a0a0a0', fontSize: 12, marginTop: 2 },
});
