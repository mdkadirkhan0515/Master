/**
 * UnitCard.js - Minimalist Professional
 * - Full card tap navigates
 * - i button popup only
 * - No shadow heavy, flat clean
 * - Single primary color
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../constants/theme';

const UnitCard = ({ subject, onPressInfo, onPressNavigate, themeMode='dark' }) => {
  const theme = getTheme(themeMode);
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} 
      onPress={() => onPressNavigate && onPressNavigate(subject)} 
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        style={[styles.infoButton, { backgroundColor: theme.infoButtonBg }]} 
        onPress={(e) => { e.stopPropagation(); onPressInfo && onPressInfo(subject); }} 
        activeOpacity={0.7}
      >
        <Ionicons name="information" size={18} color={theme.infoIcon} />
      </TouchableOpacity>
      
      <View style={styles.textContainer}>
        <Text style={[styles.subjectText, { color: theme.textPrimary }]} numberOfLines={2}>
          {subject.subject_text || subject.Chapter_text || 'Untitled Unit'}
        </Text>
        <Text style={[styles.idText, { color: theme.textSecondary }]}>
          Unit {subject.id} • {subject.subject_type?.toUpperCase() || 'BANGLA'}
        </Text>
      </View>
      
      <View style={[styles.arrowButton, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 12, 
    paddingVertical: 14, 
    marginHorizontal: 16, 
    marginVertical: 6, 
  },
  infoButton: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginHorizontal: 12 },
  subjectText: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  idText: { fontSize: 11, fontWeight: '400', marginTop: 3 },
  arrowButton: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});

export default UnitCard;
