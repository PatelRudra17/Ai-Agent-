import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '../services/api';

const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#9ca3af' };
const statusColors = { pending: '#eab308', inprogress: '#3b82f6', done: '#22c55e', overdue: '#ef4444' };

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks/my');
      setTasks(data.tasks);
    } catch {}
  };

  useEffect(() => { fetchTasks(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchTasks(); setRefreshing(false); };

  const handleAction = async (taskId, action) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/${action}`);
      Alert.alert('Success', `Task ${action === 'start' ? 'started' : 'completed'}${data.nextTask ? '\nNext task auto-assigned!' : ''}`);
      fetchTasks();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filters}>
        {['all', 'pending', 'inprogress', 'done'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'inprogress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No tasks</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: priorityColors[item.priority] + '20' }]}>
                <Text style={[styles.badgeText, { color: priorityColors[item.priority] }]}>{item.priority}</Text>
              </View>
            </View>
            {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status}</Text>
              </View>
              {item.dueDate && (
                <Text style={styles.due}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
              )}
            </View>
            <View style={styles.actions}>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction(item._id, 'start')}>
                  <Text style={styles.actionBtnText}>Start</Text>
                </TouchableOpacity>
              )}
              {item.status === 'inprogress' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => handleAction(item._id, 'complete')}>
                  <Text style={styles.actionBtnText}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e5e7eb' },
  filterActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  desc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  due: { fontSize: 11, color: '#9ca3af' },
  actions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
});
