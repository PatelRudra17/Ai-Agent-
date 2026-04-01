import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import AIChatScreen from '../screens/AIChatScreen';
import HRScreen from '../screens/HRScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ label, focused }) => (
  <Text style={{ fontSize: 10, color: focused ? '#2563eb' : '#9ca3af', marginTop: 2 }}>
    {label}
  </Text>
);

export default function MainNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22 }}>{ focused ? '🏠' : '🏠' }</Text>,
          tabBarLabel: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22 }}>📋</Text>,
          tabBarLabel: ({ focused }) => <TabIcon label="Tasks" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AI Chat"
        component={AIChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22 }}>🤖</Text>,
          tabBarLabel: ({ focused }) => <TabIcon label="AI" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HR"
        component={HRScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22 }}>📝</Text>,
          tabBarLabel: ({ focused }) => <TabIcon label="HR" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22 }}>👤</Text>,
          tabBarLabel: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
