/**
 * TTSPanelModal.js - Unified Single Primary Color
 * - All icons use primary color soft tone, not multiple accent colors
 */
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../constants/theme';

const AUDIO_MODES = [
  { id: 'q-iiii', title: 'Full Audio Mode', subtitle: 'Read question and all 4 options', icon: 'volume-high-outline' },
  { id: 'q-iiii-GS', title: 'Auto Play (Full)', subtitle: 'Auto-slide with all options read', icon: 'play-circle-outline' },
  { id: 'q-A', title: 'Quick Answer Audio', subtitle: 'Read question and correct answer', icon: 'volume-medium-outline' },
  { id: 'q-A-GS', title: 'Auto Play (Quick)', subtitle: 'Auto-slide with answer only', icon: 'play-forward-outline' },
];

const PRACTICE_MODES = [
  { id: 'M-iiii', title: 'Manual Practice', subtitle: 'Tap to choose answers manually', icon: 'hand-right-outline' },
  { id: 'A-A', title: 'Mistakes First', subtitle: 'Show incorrect on top (card border red/green)', icon: 'filter-outline' },
  { id: 'tree-q', title: 'Retry Mistakes', subtitle: 'Practice only missed questions', icon: 'repeat-outline' },
  { id: 'rest', title: 'Reset Filters', subtitle: 'Restore default quiz settings', icon: 'refresh-outline' },
];

const TTSPanelModal = ({ visible=false, onClose, activeMode='M-iiii', onSelectMode, themeMode='dark' }) => {
  const theme = getTheme(themeMode);
  
  const renderMode = (mode) => {
    const isActive = activeMode === mode.id;
    return (
      <TouchableOpacity 
        key={mode.id} 
        style={[styles.modeButton, { backgroundColor: isActive ? theme.primarySoft : theme.cardBackground, borderColor: isActive ? theme.primary : theme.border }]} 
        onPress={() => onSelectMode && onSelectMode(mode.id)} 
        activeOpacity={0.7}
      >
        <View style={[styles.modeIconBox, { backgroundColor: isActive ? theme.primary : theme.borderLight }]}>
          <Ionicons name={mode.icon} size={18} color={isActive ? '#FFF' : theme.textSecondary} />
        </View>
        <View style={styles.modeTextBox}>
          <Text style={[styles.modeLabel, { color: isActive ? theme.primary : theme.textPrimary }]}>{mode.title}</Text>
          <Text style={[styles.modeSub, { color: theme.textSecondary }]} numberOfLines={1}>{mode.subtitle}</Text>
        </View>
        {isActive && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Audio & Practice Modes</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Unified primary color • Border-only selection</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Audio & Auto Play</Text>
            <View style={styles.grid}>{AUDIO_MODES.map(renderMode)}</View>
            
            <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>Practice & Filter</Text>
            <View style={styles.grid}>{PRACTICE_MODES.map(renderMode)}</View>
            
            <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="bulb-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Card Level Feedback: Wrong = red border #EF4444, Correct = green #10B981. Options keep sky blue border, no tick/cross.</Text>
            </View>
          </ScrollView>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={onClose}>
            <Text style={[styles.closeText, { color: theme.textPrimary }]}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, padding: 18, paddingBottom: 28, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  modeButton: { width: '48%', borderRadius: 12, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', minHeight: 68 },
  modeIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  modeTextBox: { flex: 1 },
  modeLabel: { fontSize: 12, fontWeight: '600' },
  modeSub: { fontSize: 10, marginTop: 2, lineHeight: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 14, gap: 6 },
  infoText: { flex: 1, fontSize: 10.5, lineHeight: 14 },
  closeButton: { borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  closeText: { fontSize: 13, fontWeight: '600' },
});

export default TTSPanelModal;
