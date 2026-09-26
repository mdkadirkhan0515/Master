/**
 * SubHeaderToolbar.js - Icon-only Sub-Header Bar below main header
 * - 44-48px height, horizontal scroll
 * - Grouping separator vertical divider
 * - Active: sky blue border ring + light bg
 * - Inactive: #94A3B8 gray
 * - Long-press tooltip
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../constants/theme';

const MODES = [
  { id: 'M-iiii', icon: 'hand-left-outline', label: 'Manual Practice', group: 'practice' },
  { id: 'A-A', icon: 'filter-outline', label: 'Mistakes First', group: 'practice' },
  { id: 'tree-q', icon: 'refresh-outline', label: 'Retry Mistakes', group: 'practice' },
  { id: 'DIVIDER', isDivider: true },
  { id: 'q-iiii', icon: 'volume-high-outline', label: 'Full Audio Mode', group: 'audio' },
  { id: 'q-A', icon: 'flash-outline', label: 'Quick Answer Audio', group: 'audio' },
  { id: 'q-iiii-GS', icon: 'play-circle-outline', label: 'Auto Play Full', group: 'auto' },
  { id: 'q-A-GS', icon: 'play-forward-outline', label: 'Auto Play Quick', group: 'auto' },
  { id: 'DIVIDER2', isDivider: true },
  { id: 'rest', icon: 'trash-outline', label: 'Reset', group: 'reset' },
];

const SubHeaderToolbar = ({ activeMode, onSelectMode, themeMode = 'dark', fontScale = 'medium', onFontChange }) => {
  const theme = getTheme(themeMode);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0 });
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef(null);

  const showTooltip = (text, x) => {
    setTooltip({ visible: true, text, x });
    Animated.timing(tooltipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setTimeout(() => hideTooltip(), 3000);
  };

  const hideTooltip = () => {
    Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setTooltip({ visible: false, text: '', x: 0 });
    });
  };

  const handleLongPress = (mode, x) => {
    showTooltip(mode.label, x);
  };

  const FontScaleControl = () => {
    const scales = ['small', 'medium', 'large'];
    const currentIdx = scales.indexOf(fontScale);
    
    return (
      <View style={[styles.fontControl, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.fontBtn} 
          onPress={() => {
            const newIdx = Math.max(0, currentIdx - 1);
            onFontChange && onFontChange(scales[newIdx]);
          }}
        >
          <Text style={[styles.fontBtnText, { color: theme.textPrimary }]}>A-</Text>
        </TouchableOpacity>
        <View style={[styles.fontDivider, { backgroundColor: theme.border }]} />
        <View style={styles.fontCenter}>
          <Ionicons name="text-outline" size={14} color={theme.primary} />
          <Text style={[styles.fontLabel, { color: theme.textPrimary }]}>{fontScale.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={[styles.fontDivider, { backgroundColor: theme.border }]} />
        <TouchableOpacity 
          style={styles.fontBtn} 
          onPress={() => {
            const newIdx = Math.min(scales.length - 1, currentIdx + 1);
            onFontChange && onFontChange(scales[newIdx]);
          }}
        >
          <Text style={[styles.fontBtnText, { color: theme.textPrimary }]}>A+</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {MODES.map((mode, idx) => {
          if (mode.isDivider) {
            return <View key={mode.id} style={[styles.verticalDivider, { backgroundColor: theme.divider }]} />;
          }

          const isActive = activeMode === mode.id;
          
          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isActive ? theme.primarySoft : 'transparent',
                  borderColor: isActive ? theme.primary : 'transparent',
                  borderWidth: isActive ? 1.5 : 1,
                },
              ]}
              onPress={() => onSelectMode && onSelectMode(mode.id)}
              onLongPress={(e) => {
                const x = e.nativeEvent.pageX;
                handleLongPress(mode, x);
              }}
              delayLongPress={600}
              activeOpacity={0.6}
            >
              <Ionicons 
                name={mode.icon} 
                size={18} 
                color={isActive ? theme.primary : '#94A3B8'} 
              />
            </TouchableOpacity>
          );
        })}

        <View style={[styles.verticalDivider, { backgroundColor: theme.divider, marginLeft: 4 }]} />
        
        {/* Font Scale Aa Button */}
        <View style={styles.fontWrapper}>
          <FontScaleControl />
        </View>
      </ScrollView>

      {/* Tooltip */}
      {tooltip.visible && (
        <Animated.View 
          style={[
            styles.tooltip, 
            { 
              left: Math.min(tooltip.x - 50, 250), 
              backgroundColor: theme.textPrimary,
              opacity: tooltipOpacity,
            }
          ]}
        >
          <Text style={[styles.tooltipText, { color: theme.background }]}>{tooltip.text}</Text>
          <View style={[styles.tooltipArrow, { borderTopColor: theme.textPrimary }]} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 46,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    height: 46,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
    alignSelf: 'center',
  },
  fontWrapper: {
    marginLeft: 4,
  },
  fontControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    height: 36,
    paddingHorizontal: 2,
  },
  fontBtn: {
    width: 28,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  fontBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fontDivider: {
    width: 1,
    height: 16,
  },
  fontCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
  },
  fontLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tooltip: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 100,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -4,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default SubHeaderToolbar;
