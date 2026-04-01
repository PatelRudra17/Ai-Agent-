import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import api from '../services/api';
import { getUser } from '../services/storage';

export default function DashboardScreen() {
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ tasks: 0, pending: 0, meetings: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const u = await getUser();
    setUserState(u);

    try {
      const { data } = await api.get('/tasks/my');
      const pending = data.tasks.filter((t) => t.status === 'pending' || t.status === 'inprogress').length;
      const total = data.tasks.length;
      setStats((s) => ({ ...s, tasks: total, pending }));
    } catch {}

    try {
      const { data } = await api.get('/meetings');
      const today = new Date().toDateString();
      const todayMeetings = data.meetings.filter((m) => new Date(m.scheduledAt).toDateString() === today).length;
      setStats((s) => ({ ...s, meetings: todayMeetings }));
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.greeting}>Welcome back, {user?.name || 'User'}!</Text>
      <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>

      <View style={styles.grid}>
        <StatCard title="My Tasks" value={stats.tasks} color="#2563eb" />
        <StatCard title="Pending" value={stats.pending} color="#eab308" />
        <StatCard title="Today's Meetings" value={stats.meetings} color="#8b5cf6" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {['View Tasks', 'AI Chat', 'Apply Leave', 'Submit EOD'].map((action) => (
            <View key={action} style={styles.actionCard}>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginTop: 8 },
  role: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  statTitle: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  actionText: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
