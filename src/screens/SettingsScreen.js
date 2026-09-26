/**
 * SettingsScreen.js - Unified Single Primary Color + Fixed Bugs
 * - Primary: #0284C7 Light / #38BDF8 Dark only
 * - No multiple accent colors: Sync buttons, icons all primary
 * - Delete fixed, Bangla/English forcedType fixed
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Pressable, Switch, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../constants/theme';
import { initDatabase, insertCustomData, insertSubjectData, clearAllData, deleteChapter, renameChapter } from '../database/db';
import { fetchJsonFromUrl, parseCustomJson, saveUrlHistory, getUrlHistory, deleteUrlHistoryItem } from '../utils/jsonImporter';
import { updateTTSConfig, getTTSConfig } from '../utils/ttsEngine';

const STORAGE_KEYS = { BANGLA_URL: 'bangla_url', ENGLISH_URL: 'english_url', HISTORY: 'url_history', TTS_CONFIG: 'tts_config', THEME_MODE: 'theme_mode', BG_READER: 'bg_reader' };

const SettingsScreen = ({ themeMode='dark', setThemeMode }) => {
  const [banglaUrl, setBanglaUrl] = useState(''); 
  const [englishUrl, setEnglishUrl] = useState(''); 
  const [customJson, setCustomJson] = useState(''); 
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [ttsConfig, setTtsConfig] = useState(getTTSConfig()); 
  const [bgReader, setBgReader] = useState(false); 
  const [showTargetModal, setShowTargetModal] = useState(false); 
  const [pendingData, setPendingData] = useState(null); 
  const [renameModal, setRenameModal] = useState({ visible:false, chapterId:null, name:'', historyId:null });
  
  const theme = getTheme(themeMode);
  
  useEffect(() => { loadSaved(); }, []);
  
  const loadSaved = async () => {
    try { 
      const bUrl = await AsyncStorage.getItem(STORAGE_KEYS.BANGLA_URL); 
      const eUrl = await AsyncStorage.getItem(STORAGE_KEYS.ENGLISH_URL); 
      const hist = await getUrlHistory(); 
      const tts = await AsyncStorage.getItem(STORAGE_KEYS.TTS_CONFIG); 
      const bg = await AsyncStorage.getItem(STORAGE_KEYS.BG_READER); 
      if (bUrl) setBanglaUrl(bUrl); 
      if (eUrl) setEnglishUrl(eUrl); 
      setHistory(hist); 
      if (tts) { const parsed = JSON.parse(tts); setTtsConfig(parsed); updateTTSConfig(parsed); } 
      if (bg) setBgReader(bg === 'true'); 
    } catch {}
  };
  
  const triggerReload = (type) => { DeviceEventEmitter.emit('DATA_IMPORTED', { type }); };
  
  const extractChapterIds = (data) => {
    if (Array.isArray(data)) return data.map(s => String(s.id || s.Chapter_id)).filter(Boolean);
    if (data.chapters) return data.chapters.map(c => String(c.Chapter_id || c.chapter_Id || c.id)).filter(Boolean);
    return [];
  };

  const handleCloudImport = async (url, type) => {
    if (!url.trim()) { Alert.alert('Error','URL required'); return; } 
    setLoading(true);
    try { 
      await initDatabase(); 
      const normalized = await fetchJsonFromUrl(url.trim(), type); 
      let result; 
      let chapterIds = [];
      if (Array.isArray(normalized)) { 
        chapterIds = normalized.map(s => String(s.id || s.Chapter_id)).filter(Boolean);
        await insertSubjectData(normalized, type); 
        result = { chapters: normalized.length, questions: normalized.reduce((s,x)=>s+(x.questions?.length||0),0) }; 
      } else { 
        chapterIds = extractChapterIds(normalized);
        result = await insertCustomData(normalized, type); 
      } 
      await AsyncStorage.setItem(type === 'bangla' ? STORAGE_KEYS.BANGLA_URL : STORAGE_KEYS.ENGLISH_URL, ''); 
      if (type === 'bangla') setBanglaUrl(''); else setEnglishUrl(''); 
      await saveUrlHistory(url.trim(), type, chapterIds); 
      const newHist = await getUrlHistory(); 
      setHistory(newHist); 
      triggerReload(type); 
      Alert.alert('Synced to ' + type.toUpperCase(), `Chapters: ${result.chapters}\nQuestions: ${result.questions}`); 
    } catch (e) { 
      Alert.alert('Failed', e.message); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleCustomJsonSubmit = () => { 
    if (!customJson.trim()) { Alert.alert('Error','Paste JSON first'); return; } 
    try { 
      const normalized = parseCustomJson(customJson.trim(), null); 
      setPendingData(normalized); 
      setShowTargetModal(true); 
    } catch (e) { 
      Alert.alert('JSON Error', e.message); 
    } 
  };
  
  const confirmTargetImport = async (target) => {
    setShowTargetModal(false); 
    if (!pendingData) return; 
    setLoading(true);
    try { 
      await initDatabase(); 
      let dataToInsert = pendingData;
      let result; 
      let chapterIds = [];
      if (Array.isArray(dataToInsert)) { 
        const withTarget = dataToInsert.map(s => ({ ...s, subject_type: target }));
        chapterIds = withTarget.map(s => String(s.id || s.Chapter_id)).filter(Boolean);
        await insertSubjectData(withTarget, target); 
        result = { chapters: withTarget.length, questions: withTarget.reduce((s,x)=>s+(x.questions?.length||0),0) }; 
      } else { 
        chapterIds = extractChapterIds(dataToInsert);
        result = await insertCustomData(dataToInsert, target); 
      } 
      setCustomJson(''); 
      await saveUrlHistory(`Custom JSON → ${target.toUpperCase()} (${result.chapters} ch)`, target, chapterIds); 
      const newHist = await getUrlHistory(); 
      setHistory(newHist); 
      triggerReload(target); 
      Alert.alert('Imported to ' + target.toUpperCase(), `Chapters: ${result.chapters}\nQuestions: ${result.questions}`); 
    } catch (e) { 
      Alert.alert('Failed', e.message); 
    } finally { 
      setLoading(false); 
      setPendingData(null); 
    }
  };
  
  const updateTts = async (key, delta) => { 
    let newVal = ttsConfig[key] + delta; 
    if (key === 'rate') newVal = Math.max(0.5, Math.min(2.0, newVal)); 
    if (key === 'pitch') newVal = Math.max(0.5, Math.min(2.0, newVal)); 
    const newConfig = { ...ttsConfig, [key]: newVal }; 
    setTtsConfig(newConfig); 
    updateTTSConfig(newConfig); 
    await AsyncStorage.setItem(STORAGE_KEYS.TTS_CONFIG, JSON.stringify(newConfig)); 
  };
  
  const toggleBgReader = async (val) => { 
    setBgReader(val); 
    await AsyncStorage.setItem(STORAGE_KEYS.BG_READER, String(val)); 
  };
  
  const handleRename = async () => { 
    if (!renameModal.name.trim()) { Alert.alert('Error','Name required'); return; } 
    if (!renameModal.chapterId) { Alert.alert('Error','No chapter selected'); return; }
    try { 
      await renameChapter(renameModal.chapterId, renameModal.name.trim()); 
      setHistory(await getUrlHistory()); 
      triggerReload('all'); 
      setRenameModal({ visible:false, chapterId:null, name:'', historyId:null }); 
      Alert.alert('Renamed'); 
    } catch (e) { 
      Alert.alert('Failed', e.message); 
    } 
  };
  
  const handleDeleteHistory = async (item) => { 
    Alert.alert('Delete?', `Delete "${item.url}"?`, [
      {text:'Cancel', style:'cancel'}, 
      {text:'Delete', style:'destructive', onPress: async ()=>{
        try{ 
          if (item.chapterIds && item.chapterIds.length > 0) {
            for (const chId of item.chapterIds) {
              try { await deleteChapter(chId); } catch {}
            }
          }
          const updated = await deleteUrlHistoryItem(item.id);
          setHistory(updated); 
          triggerReload('all'); 
          Alert.alert('Deleted');
        } catch(e){ 
          Alert.alert('Failed', e.message); 
        }
      }}
    ]); 
  };

  const handleClearAll = async () => {
    Alert.alert('Clear All?', 'All chapters and history will be deleted permanently', [
      {text:'Cancel', style:'cancel'},
      {text:'Clear All', style:'destructive', onPress: async ()=>{
        try {
          await clearAllData();
          await initDatabase();
          const { clearUrlHistory } = await import('../utils/jsonImporter');
          await clearUrlHistory();
          setHistory([]);
          triggerReload('all');
          Alert.alert('Cleared', 'All data deleted');
        } catch(e){ Alert.alert('Failed', e.message); }
      }}
    ]);
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Cloud Import - Unified primary color */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="cloud-download-outline" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Cloud Import (URL)</Text>
        </View>
        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Bangla MCQ Source</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, { flex:1, backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} placeholder="https://example.com/bangla.json" placeholderTextColor={theme.textSecondary} value={banglaUrl} onChangeText={setBanglaUrl} autoCapitalize="none" />
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: theme.primary }]} onPress={() => handleCloudImport(banglaUrl, 'bangla')} disabled={loading}>
            <Ionicons name="cloud-download-outline" size={14} color="#FFF" />
            <Text style={styles.syncText}>Sync</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>English MCQ Source</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, { flex:1, backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} placeholder="https://example.com/english.json" placeholderTextColor={theme.textSecondary} value={englishUrl} onChangeText={setEnglishUrl} autoCapitalize="none" />
          <TouchableOpacity style={[styles.syncBtn, { backgroundColor: theme.primary }]} onPress={() => handleCloudImport(englishUrl, 'english')} disabled={loading}>
            <Ionicons name="cloud-download-outline" size={14} color="#FFF" />
            <Text style={styles.syncText}>Sync</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom JSON - Unified */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="code-slash-outline" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Custom JSON Input</Text>
          </View>
          <TouchableOpacity onPress={() => setCustomJson('')} style={styles.trashBtn}>
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.textArea, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border }]} placeholder='{"dictionary":[...],"chapters":[...],"questions":[...]}' placeholderTextColor={theme.textSecondary} value={customJson} onChangeText={setCustomJson} multiline textAlignVertical="top" />
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleCustomJsonSubmit} disabled={loading}>
          <Ionicons name="checkmark-done-outline" size={16} color="#FFF" />
          <Text style={styles.primaryText}>Import Data</Text>
        </TouchableOpacity>
      </View>

      {/* Background Reader - Unified */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="headset-outline" size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom:2 }]}>Background MCQ Reader</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Continue after minimizing app</Text>
            </View>
          </View>
          <Switch value={bgReader} onValueChange={toggleBgReader} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFF" />
        </View>
      </View>

      {/* Voice - Unified */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="mic-outline" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Voice & Speech Settings</Text>
        </View>
        <View style={styles.voiceRow}>
          <View style={styles.voiceLeft}>
            <Ionicons name="speedometer-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.voiceLabel, { color: theme.textPrimary }]}>Speech Rate</Text>
          </View>
          <View style={styles.voiceControls}>
            <TouchableOpacity style={[styles.ctrlBtn, { borderColor: theme.border }]} onPress={() => updateTts('rate', -0.1)}>
              <Ionicons name="remove" size={14} color={theme.primary} />
            </TouchableOpacity>
            <View style={[styles.pillBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.pillText, { color: theme.textPrimary }]}>{ttsConfig.rate.toFixed(1)}x</Text>
            </View>
            <TouchableOpacity style={[styles.ctrlBtn, { borderColor: theme.border }]} onPress={() => updateTts('rate', 0.1)}>
              <Ionicons name="add" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.voiceRow}>
          <View style={styles.voiceLeft}>
            <Ionicons name="options-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.voiceLabel, { color: theme.textPrimary }]}>Voice Pitch</Text>
          </View>
          <View style={styles.voiceControls}>
            <TouchableOpacity style={[styles.ctrlBtn, { borderColor: theme.border }]} onPress={() => updateTts('pitch', -0.1)}>
              <Ionicons name="remove" size={14} color={theme.primary} />
            </TouchableOpacity>
            <View style={[styles.pillBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.pillText, { color: theme.textPrimary }]}>{ttsConfig.pitch.toFixed(1)}</Text>
            </View>
            <TouchableOpacity style={[styles.ctrlBtn, { borderColor: theme.border }]} onPress={() => updateTts('pitch', 0.1)}>
              <Ionicons name="add" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary, marginBottom: 10 }]}>App Theme</Text>
        <View style={[styles.segmented, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.segmentBtn, themeMode === 'light' && { backgroundColor: theme.primary }]} onPress={() => { setThemeMode && setThemeMode('light'); AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'light'); }}>
            <Ionicons name="sunny-outline" size={14} color={themeMode === 'light' ? '#FFF' : theme.textPrimary} />
            <Text style={[styles.segmentText, { color: themeMode === 'light' ? '#FFF' : theme.textPrimary }]}>Light</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segmentBtn, themeMode === 'dark' && { backgroundColor: theme.primary }]} onPress={() => { setThemeMode && setThemeMode('dark'); AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark'); }}>
            <Ionicons name="moon-outline" size={14} color={themeMode === 'dark' ? '#FFF' : theme.textPrimary} />
            <Text style={[styles.segmentText, { color: themeMode === 'dark' ? '#FFF' : theme.textPrimary }]}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History - Unified */}
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Imported File History</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={{ color:'#EF4444', fontSize:11, fontWeight:'600' }}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {history.length === 0 ? 
          <Text style={[styles.emptyHist, { color: theme.textSecondary }]}>No history yet</Text> : 
          history.map((item) => (
            <View key={item.id} style={[styles.histItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <TouchableOpacity style={[styles.histIcon, { backgroundColor: theme.primarySoft }]} onPress={() => {
                const firstChId = item.chapterIds && item.chapterIds[0] ? item.chapterIds[0] : item.id;
                setRenameModal({ visible:true, chapterId: firstChId, name: item.url, historyId: item.id });
              }}>
                <Ionicons name="pencil-outline" size={14} color={theme.primary} />
              </TouchableOpacity>
              <View style={styles.histCenter}>
                <Text style={[styles.histUrl, { color: theme.textPrimary }]} numberOfLines={1}>{item.url}</Text>
                <Text style={[styles.histDate, { color: theme.textSecondary }]}>{item.type?.toUpperCase()} • {item.chapterIds?.length ? item.chapterIds.length + ' chapters' : ''} • {new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteHistory(item)} style={styles.histDel}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        }
      </View>

      <Modal visible={showTargetModal} transparent animationType="fade" onRequestClose={() => setShowTargetModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTargetModal(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.cardBackground }]} onPress={(e)=>e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Target Subject</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Where to import this JSON?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={() => confirmTargetImport('bangla')}>
                <Ionicons name="journal" size={16} color="#FFF" />
                <Text style={styles.modalBtnText}>Bangla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={() => confirmTargetImport('english')}>
                <Ionicons name="book" size={16} color="#FFF" />
                <Text style={styles.modalBtnText}>English</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={renameModal.visible} transparent animationType="fade" onRequestClose={() => setRenameModal({ visible:false, chapterId:null, name:'', historyId:null })}>
        <Pressable style={styles.modalOverlay} onPress={() => setRenameModal({ visible:false, chapterId:null, name:'', historyId:null })}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.cardBackground }]} onPress={(e)=>e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Rename Chapter</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>Chapter ID: {renameModal.chapterId}</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border, marginTop:10 }]} value={renameModal.name} onChangeText={(t)=>setRenameModal(prev=>({...prev, name:t}))} placeholder="New name" placeholderTextColor={theme.textSecondary} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={()=>setRenameModal({ visible:false, chapterId:null, name:'', historyId:null })}>
                <Text style={[styles.modalBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleRename}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={theme.primary} /><Text style={{ color:'#FFF', marginTop:10 }}>Importing...</Text></View>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1 }, 
  content: { padding:16, paddingBottom:30 }, 
  card: { borderRadius:12, borderWidth:1, padding:14, marginBottom:12 }, 
  cardTitleRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }, 
  cardTitle: { fontSize:13, fontWeight:'600' }, 
  iconBox: { width:28, height:28, borderRadius:6, justifyContent:'center', alignItems:'center' },
  inputLabel: { fontSize:11, fontWeight:'500', marginBottom:6 }, 
  inputRow: { flexDirection:'row', gap:8, alignItems:'center' }, 
  input: { borderWidth:1, borderRadius:8, paddingHorizontal:12, paddingVertical:10, fontSize:12 }, 
  textArea: { borderWidth:1, borderRadius:8, padding:12, fontSize:11, minHeight:120, marginBottom:10 }, 
  syncBtn: { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:9, borderRadius:8, gap:5 }, 
  syncText: { color:'#FFF', fontSize:11, fontWeight:'600' }, 
  primaryBtn: { flexDirection:'row', justifyContent:'center', alignItems:'center', paddingVertical:10, borderRadius:8, gap:6 }, 
  primaryText: { color:'#FFF', fontSize:12, fontWeight:'600' }, 
  trashBtn: { padding:4 }, 
  rowBetween: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' }, 
  subtitle: { fontSize:11, marginTop:2 }, 
  voiceRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }, 
  voiceLeft: { flexDirection:'row', alignItems:'center', gap:6 }, 
  voiceLabel: { fontSize:12, fontWeight:'500' }, 
  voiceControls: { flexDirection:'row', alignItems:'center', gap:8 }, 
  ctrlBtn: { width:28, height:28, borderRadius:6, backgroundColor:'transparent', borderWidth:1, justifyContent:'center', alignItems:'center' }, 
  pillBadge: { minWidth:46, paddingHorizontal:10, paddingVertical:4, borderRadius:16, borderWidth:1, alignItems:'center' }, 
  pillText: { fontSize:11, fontWeight:'600' }, 
  segmented: { flexDirection:'row', borderRadius:10, borderWidth:1, padding:3, gap:4 }, 
  segmentBtn: { flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', paddingVertical:9, borderRadius:7, gap:5 }, 
  segmentText: { fontSize:11, fontWeight:'600' }, 
  emptyHist: { fontSize:11, textAlign:'center', padding:10 }, 
  histItem: { flexDirection:'row', alignItems:'center', borderWidth:1, borderRadius:8, padding:10, marginBottom:6 }, 
  histIcon: { width:26, height:26, borderRadius:6, justifyContent:'center', alignItems:'center', marginRight:8 }, 
  histCenter: { flex:1 }, 
  histUrl: { fontSize:11, fontWeight:'500' }, 
  histDate: { fontSize:9, marginTop:2 }, 
  histDel: { padding:6 }, 
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', padding:20 }, 
  modalBox: { width:'100%', borderRadius:12, padding:18 }, 
  modalTitle: { fontSize:14, fontWeight:'700' }, 
  modalSub: { fontSize:11, marginTop:4 }, 
  modalActions: { flexDirection:'row', gap:10, marginTop:16 }, 
  modalBtn: { flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', paddingVertical:11, borderRadius:8, gap:6 }, 
  modalBtnText: { color:'#FFF', fontWeight:'600', fontSize:12 }, 
  loadingOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
});

export default SettingsScreen;
