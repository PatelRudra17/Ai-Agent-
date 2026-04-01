import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import api from '../services/api';
import { getUser, clearTokens } from '../services/storage';

export default function ProfileScreen({ onLogout }) {
  const [user, setUserState] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUserState(data.user);
    } catch {
      const cached = await getUser();
      setUserState(cached);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await api.post('/auth/logout'); } catch {}
          await clearTokens();
          onLogout();
        },
      },
    ]);
  };

  if (!user) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.infoSection}>
        <InfoRow label="Department" value={user.department || 'Not set'} />
        <InfoRow label="Phone" value={user.phone || 'Not set'} />
        <InfoRow label="Language" value={user.preferredLanguage === 'hi' ? 'Hindi' : user.preferredLanguage === 'gu' ? 'Gujarati' : 'English'} />
        <InfoRow label="Status" value={user.isActive ? 'Active' : 'Inactive'} />
        <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  loading: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginTop: 12 },
  email: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  roleBadge: { alignSelf: 'center', backgroundColor: '#dbeafe', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  roleText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  infoSection: { backgroundColor: '#fff', borderRadius: 12, marginTop: 24, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});
