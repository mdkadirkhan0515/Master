/**
 * BottomTabNavigator.js - Unified primary color
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import UnitListScreen from '../screens/UnitListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getTheme } from '../constants/theme';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = ({ themeMode='dark', setThemeMode }) => {
  const theme = getTheme(themeMode);
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false, 
        tabBarStyle: { backgroundColor: theme.tabBackground, borderTopColor: theme.border, borderTopWidth: 1, height: 60, paddingBottom: 6, paddingTop: 6 }, 
        tabBarActiveTintColor: theme.primary, 
        tabBarInactiveTintColor: theme.tabInactive, 
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } 
      }}>
      <Tab.Screen 
        name="Bangla" 
        options={{ 
          tabBarLabel: 'Bangla MCQ', 
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, { backgroundColor: focused ? `${color}15` : 'transparent' }]}>
              <Ionicons name={focused ? 'journal' : 'journal-outline'} size={20} color={color} />
            </View>
          ) 
        }}>
        {(props) => <UnitListScreen {...props} themeMode={themeMode} />}
      </Tab.Screen>
      <Tab.Screen 
        name="English" 
        options={{ 
          tabBarLabel: 'English MCQ', 
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, { backgroundColor: focused ? `${color}15` : 'transparent' }]}>
              <Ionicons name={focused ? 'book' : 'book-outline'} size={20} color={color} />
            </View>
          ) 
        }}>
        {(props) => <UnitListScreen {...props} themeMode={themeMode} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Settings" 
        options={{ 
          tabBarLabel: 'Settings', 
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, { backgroundColor: focused ? `${color}15` : 'transparent' }]}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={20} color={color} />
            </View>
          ) 
        }}>
        {(props) => <SettingsScreen {...props} themeMode={themeMode} setThemeMode={setThemeMode} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({ iconBox: { width: 32, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' } });
export default BottomTabNavigator;
