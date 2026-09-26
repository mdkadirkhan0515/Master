/**
 * UnitOverviewModal.js - PLAYER: English labels
 * Header: Unit Overview / Chapter Progress with analytics-outline icon
 * Boxes: Total Questions, Attempted, Correct, Incorrect - English
 */
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../constants/theme';

const UnitOverviewModal = ({ visible=false, onClose, subject=null, progress={ total:0, read:0, correct:0, wrong:0 }, themeMode='dark' }) => {
  const theme = getTheme(themeMode);
  const percentage = progress.total > 0 ? Math.round((progress.read / progress.total) * 100) : 0;
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
              <Ionicons name="analytics-outline" size={20} color="#38BDF8" />
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{subject?.subject_text || 'Unit Overview'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: '#38BDF8' }]} />
          </View>
          <Text style={[styles.percentText, { color: theme.textSecondary }]}>{percentage}% Completed</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(100,116,139,0.15)' }]}>
                <Ionicons name="layers-outline" size={18} color="#64748B" />
              </View>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Questions</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>{progress.total}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: '#38BDF8' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(56,189,248,0.2)' }]}>
                <Ionicons name="checkmark-done-outline" size={18} color="#38BDF8" />
              </View>
              <Text style={[styles.statLabel, { color: '#38BDF8' }]}>Attempted</Text>
              <Text style={[styles.statValue, { color: '#38BDF8' }]}>{progress.read}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: '#34D399' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(52,211,153,0.2)' }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#34D399" />
              </View>
              <Text style={[styles.statLabel, { color: '#34D399' }]}>Correct</Text>
              <Text style={[styles.statValue, { color: '#34D399' }]}>{progress.correct}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: '#F87171' }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(248,113,113,0.2)' }]}>
                <Ionicons name="close-circle-outline" size={18} color="#F87171" />
              </View>
              <Text style={[styles.statLabel, { color: '#F87171' }]}>Incorrect</Text>
              <Text style={[styles.statValue, { color: '#F87171' }]}>{progress.wrong}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.okButton, { backgroundColor: '#38BDF8' }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.okText}>Got It</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 18, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  percentText: { fontSize: 11, fontWeight: '600', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  statBox: { width: '47.5%', borderRadius: 14, borderWidth: 1, padding: 12 },
  statIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  okButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  okText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

export default UnitOverviewModal;
