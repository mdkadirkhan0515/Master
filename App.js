/**
 * App.js - Main Entry Point for MCQ Admission App
 * Theme: #1E293B, #38BDF8, #34D399, #F87171
 * SafeAreaProvider & SafeAreaView: স্ক্রিনের সেফ জোনের ভেতর UI ধরে রাখার জন্য
 * StatusBar: প্রফেশনাল ডার্ক থিমের (#1E293B) সাথে সাদা আইকন ও টেক্সট
 */
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/database/db';
import { initAudioMode } from './src/utils/ttsEngine';
import { getTheme } from './src/constants/theme';

// react-native-screens optimization
enableScreens(true);

const STORAGE_THEME = 'theme_mode';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    const prepare = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_THEME);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeMode(savedTheme);
        }
        await initDatabase();
        await initAudioMode();
      } catch (e) {
        console.log('App init error', e);
      } finally {
        setIsReady(true);
      }
    };
    prepare();
  }, []);

  const theme = getTheme(themeMode);

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.background,
      card: theme.cardBackground,
      text: theme.textPrimary,
      border: theme.border,
      primary: '#38BDF8',
    },
  };

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.cardBackground,
      text: theme.textPrimary,
      border: theme.border,
      primary: '#38BDF8',
    },
  };

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: '#1E293B' }]}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <NavigationContainer theme={themeMode === 'dark' ? MyDarkTheme : MyLightTheme}>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <RootNavigator themeMode={themeMode} setThemeMode={setThemeMode} />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
