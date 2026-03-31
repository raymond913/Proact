// src/navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import CalendarScreen from '../screens/CalendarScreen';
import FridgeScreen from '../screens/FridgeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }) {
  const icons = { Today: '⬜', Fridge: '⬜', Progress: '⬜' };
  const activeIcons = { Today: '▪', Fridge: '▪', Progress: '▪' };
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconDot, focused && styles.iconDotActive]}>
        {focused ? '●' : '○'}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Today"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Today" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Fridge"
        component={FridgeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Fridge" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Progress" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    fontSize: 8,
    color: colors.tabBarInactive,
  },
  iconDotActive: {
    color: colors.tabBarActive,
  },
});
