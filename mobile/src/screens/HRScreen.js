import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import api from '../services/api';
import { getUser } from '../services/storage';

export default function HRScreen() {
  const [tab, setTab] = useState('leave');
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'casual', fromDate: '', toDate: '', reason: '' });

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/hr/leave/my');
      setLeaves(data.leaves);
    } catch {}
  };

  const fetchBalance = async () => {
    try {
      const user = await getUser();
      const { data } = await api.get(`/hr/leave/balance/${user.id}`);
      setBalance(data.balance);
    } catch {}
  };

  useEffect(() => { fetchLeaves(); fetchBalance(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchLeaves(); await fetchBalance(); setRefreshing(false); };

  const handleApply = async () => {
    if (!form.fromDate || !form.toDate || !form.reason) return Alert.alert('Error', 'Fill all fields');
    try {
      await api.post('/hr/leave/apply', form);
      Alert.alert('Success', 'Leave applied');
      setShowForm(false);
      setForm({ type: 'casual', fromDate: '', toDate: '', reason: '' });
      fetchLeaves();
      fetchBalance();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const handleClock = async (type) => {
    try {
      const { data } = await api.post(`/hr/attendance/${type}`);
      Alert.alert('Success', data.message);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const statusColors = { pending: '#eab308', approved: '#22c55e', rejected: '#ef4444' };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {['leave', 'attendance'].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'leave' ? 'Leave' : 'Attendance'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'leave' && (
        <>
          {/* Balance Cards */}
          {balance && (
            <View style={styles.balanceRow}>
              {Object.entries(balance).filter(([k]) => k !== 'unpaid').map(([type, b]) => (
                <View key={type} style={styles.balanceCard}>
                  <Text style={styles.balanceType}>{type}</Text>
                  <Text style={styles.balanceValue}>{b.remaining}</Text>
                  <Text style={styles.balanceUsed}>{b.used}/{b.total}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.applyBtnText}>{showForm ? 'Cancel' : '+ Apply Leave'}</Text>
          </TouchableOpacity>

          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formRow}>
                {['casual', 'sick', 'annual'].map((t) => (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                    style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}>
                    <Text style={[styles.typeBtnText, form.type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="From Date (YYYY-MM-DD)" value={form.fromDate}
                onChangeText={(v) => setForm({ ...form, fromDate: v })} placeholderTextColor="#9ca3af" />
              <TextInput style={styles.input} placeholder="To Date (YYYY-MM-DD)" value={form.toDate}
                onChangeText={(v) => setForm({ ...form, toDate: v })} placeholderTextColor="#9ca3af" />
              <TextInput style={styles.input} placeholder="Reason" value={form.reason}
                onChangeText={(v) => setForm({ ...form, reason: v })} multiline placeholderTextColor="#9ca3af" />
              <TouchableOpacity style={styles.submitBtn} onPress={handleApply}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={leaves}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No leave requests</Text>}
            renderItem={({ item }) => (
              <View style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <Text style={styles.leaveType}>{item.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.leaveDates}>
                  {new Date(item.fromDate).toLocaleDateString()} — {new Date(item.toDate).toLocaleDateString()}
                </Text>
                <Text style={styles.leaveReason} numberOfLines={1}>{item.reason}</Text>
              </View>
            )}
          />
        </>
      )}

      {tab === 'attendance' && (
        <View style={styles.attendanceContainer}>
          <Text style={styles.attendanceTitle}>Today's Attendance</Text>
          <View style={styles.clockRow}>
            <TouchableOpacity style={styles.clockInBtn} onPress={() => handleClock('clock-in')}>
              <Text style={styles.clockBtnText}>Clock In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clockOutBtn} onPress={() => handleClock('clock-out')}>
              <Text style={styles.clockBtnText}>Clock Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#e5e7eb', alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  balanceRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  balanceCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  balanceType: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize' },
  balanceValue: { fontSize: 24, fontWeight: '700', color: '#1f2937' },
  balanceUsed: { fontSize: 10, color: '#9ca3af' },
  applyBtn: { margin: 12, backgroundColor: '#2563eb', borderRadius: 10, padding: 12, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  formCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#2563eb' },
  typeBtnText: { fontSize: 13, fontWeight: '500', color: '#6b7280', textTransform: 'capitalize' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 8, color: '#111827' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: '600' },
  leaveCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveType: { fontSize: 14, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  leaveDates: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  leaveReason: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  attendanceContainer: { padding: 20, alignItems: 'center' },
  attendanceTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 20 },
  clockRow: { flexDirection: 'row', gap: 16 },
  clockInBtn: { backgroundColor: '#22c55e', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  clockOutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  clockBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
