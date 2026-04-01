import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  pending: '#f59e0b',
  inprogress: '#6366f1',
  done: '#10b981',
  overdue: '#ef4444',
  cancelled: '#6b7280',
  approved: '#10b981',
  rejected: '#ef4444',
};

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#6366f1',
  low: '#6b7280',
};

export default function Badge({ label, type = 'status', value }) {
  const colorMap = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const color = colorMap[value] || '#6b7280';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{label || value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
