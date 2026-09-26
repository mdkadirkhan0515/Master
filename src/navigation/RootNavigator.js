/**
 * RootNavigator.js - PLAYER: MainTabs + MCQScreen stack
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import MCQScreen from '../screens/MCQScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = ({ themeMode, setThemeMode }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs">
        {(props) => <BottomTabNavigator {...props} themeMode={themeMode} setThemeMode={setThemeMode} />}
      </Stack.Screen>
      <Stack.Screen name="MCQScreen">
        {(props) => <MCQScreen {...props} themeMode={themeMode} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
