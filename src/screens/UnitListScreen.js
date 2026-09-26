/**
 * UnitListScreen.js - PLAYER: Bangla/English separation, full card tap, instant reload via DeviceEventEmitter
 */
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import UnitCard from '../components/UnitCard';
import UnitOverviewModal from '../components/UnitOverviewModal';
import { getAllSubjects, getSubjectProgress } from '../database/queries';
import { initDatabase } from '../database/db';
import { getTheme } from '../constants/theme';

const UnitListScreen = ({ themeMode='dark' }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const lang = route.name?.toLowerCase().includes('english') ? 'english' : 'bangla';
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [progress, setProgress] = useState({ total:0, read:0, correct:0, wrong:0 });
  const [modalVisible, setModalVisible] = useState(false);
  const theme = getTheme(themeMode);

  const loadData = async () => {
    try { 
      await initDatabase(); 
      const data = await getAllSubjects(lang); 
      setSubjects(data); 
    } catch (e) { 
      console.log('UnitList load error', e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [lang]));
  
  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('DATA_IMPORTED', (payload) => { 
      if (!payload || payload.type === lang || payload.type === 'all') loadData(); 
    });
    return () => sub.remove();
  }, [lang]);

  const handleInfo = async (subject) => { 
    setSelectedSubject(subject); 
    try { 
      const prog = await getSubjectProgress(subject.id); 
      setProgress(prog); 
    } catch { 
      setProgress({ total:0, read:0, correct:0, wrong:0 }); 
    } 
    setModalVisible(true); 
  };
  
  const handleNavigate = (subject) => { 
    navigation.navigate('MCQScreen', { subjectId: subject.id, subjectText: subject.subject_text, lang }); 
  };
  
  const onRefresh = () => { setRefreshing(true); loadData(); };
  
  if (loading) return (
    <View style={[styles.loading, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#38BDF8" />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading {lang} units...</Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Ionicons name={lang === 'english' ? 'book' : 'journal'} size={20} color="#38BDF8" />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{lang === 'english' ? 'English Units' : 'Bangla Units'}</Text>
        </View>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{subjects.length} chapters • {lang.toUpperCase()}</Text>
      </View>
      
      <FlatList 
        data={subjects} 
        keyExtractor={(item) => String(item.id)} 
        renderItem={({ item, index }) => <UnitCard subject={item} index={index} themeMode={themeMode} onPressInfo={handleInfo} onPressNavigate={handleNavigate} />} 
        contentContainerStyle={styles.listContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" colors={['#38BDF8']} />} 
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No {lang} data found.{'\n'}Import from Settings.</Text>
            <TouchableOpacity style={[styles.goSettings, { backgroundColor: '#38BDF8' }]} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.goSettingsText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
        } 
      />
      
      <UnitOverviewModal visible={modalVisible} onClose={() => setModalVisible(false)} subject={selectedSubject} progress={progress} themeMode={themeMode} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 13 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2 },
  listContent: { paddingVertical: 10, paddingBottom: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyText: { textAlign: 'center', marginTop: 12, lineHeight: 20, fontSize: 13 },
  goSettings: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  goSettingsText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

export default UnitListScreen;
