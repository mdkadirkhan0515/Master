/**
 * jsonImporter.js - FIXED: subject_type target param priority
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const validateMCQJson = (data) => {
  if (!data || typeof data !== 'object') throw new Error('JSON must be object');
  if (data.dictionary) {
    if (!Array.isArray(data.dictionary)) throw new Error('dictionary must be array');
    for (let i=0;i<data.dictionary.length;i++){ const d=data.dictionary[i]; if (!d.Dictionary_text && !d.dictionary_text) throw new Error(`dictionary[${i}] missing Dictionary_text`); }
  }
  if (data.chapters && !Array.isArray(data.chapters)) throw new Error('chapters must be array');
  if (data.questions) {
    if (!Array.isArray(data.questions)) throw new Error('questions must be array');
    for (let i=0;i<data.questions.length;i++){ const q=data.questions[i]; if (!q.Question_text && !q.question_text) throw new Error(`questions[${i}] missing Question_text`); if (!q.Answer_text && !q.answer_text) throw new Error(`questions[${i}] missing Answer_text`); }
  }
  if (Array.isArray(data)) {
    for (let i=0;i<data.length;i++){ const s=data[i]; if (!s.id && !s.Chapter_id) throw new Error(`Subject ${i} missing id`); }
  }
  return true;
};

export const normalizeJsonData = (data, forcedType = null) => {
  // forcedType = 'bangla' or 'english' from UI selection - highest priority
  if (data.dictionary || data.chapters || data.questions) {
    const effectiveType = forcedType || data.subject_type || null; // don't default to bangla here
    const chapters = (data.chapters || []).map((c, idx) => {
      const idRaw = c.chapter_Id || c.Chapter_id || c.chapter_id || c.id;
      const id = idRaw ? String(idRaw).trim() : String(idx+1).padStart(2,'0');
      // Priority: forcedType > c.subject_type > data.subject_type
      const chapType = forcedType || c.subject_type || data.subject_type || null;
      return { Chapter_id: id, Chapter_text: c.Chapter_text || c.chapter_text || c.subject_text || `Chapter ${id}`, subject_type: chapType };
    });
    const dictionary = (data.dictionary || []).map(d => ({ Dictionary_id: d.Dictionary_id ? parseInt(d.Dictionary_id,10):null, Dictionary_text: String(d.Dictionary_text || d.dictionary_text || '').trim() })).filter(d=>d.Dictionary_text);
    const questions = (data.questions || []).map(q => {
      const qType = forcedType || q.subject_type || data.subject_type || null;
      return { 
        Question_id: q.Question_id || q.question_id ? parseInt(q.Question_id || q.question_id,10):null, 
        chapter_id: q.chapter_id || q.Chapter_id || q.chapter_Id ? String(q.chapter_id || q.Chapter_id || q.chapter_Id).trim():null, 
        Question_text: String(q.Question_text || q.question_text || '').trim(), 
        Answer_text: String(q.Answer_text || q.answer_text || '').trim(), 
        subject_type: qType 
      };
    }).filter(q=>q.Question_text);
    return { dictionary, chapters, questions, subject_type: effectiveType };
  }
  if (Array.isArray(data)) {
    // For old array format, apply forcedType to each subject if provided
    if (forcedType) {
      return data.map(s => ({ ...s, subject_type: forcedType }));
    }
    return data;
  }
  return data;
};

export const fetchJsonFromUrl = async (url, forcedType = null) => {
  if (!url || typeof url !== 'string') throw new Error('Invalid URL');
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) throw new Error('URL must start with http:// or https://');
  const response = await fetch(trimmed, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const text = await response.text();
  let json; try { json = JSON.parse(text); } catch { throw new Error('Invalid JSON from URL'); }
  validateMCQJson(json);
  return normalizeJsonData(json, forcedType);
};

export const parseCustomJson = (rawText, forcedType = null) => {
  if (!rawText || !rawText.trim()) throw new Error('Custom JSON is empty');
  let json; try { json = JSON.parse(rawText.trim()); } catch (e) { throw new Error(`JSON Parse Error: ${e.message}`); }
  validateMCQJson(json);
  return normalizeJsonData(json, forcedType);
};

export const saveUrlHistory = async (url, type, chapterIds = []) => {
  try {
    const key = 'url_history';
    const existing = await AsyncStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    const newItem = { id: Date.now().toString(), url, type, chapterIds, date: new Date().toISOString() };
    const updated = [newItem, ...history].slice(0, 50);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch { return []; }
};

export const getUrlHistory = async () => { try { const data = await AsyncStorage.getItem('url_history'); return data ? JSON.parse(data) : []; } catch { return []; } };
export const deleteUrlHistoryItem = async (id) => { try { const history = await getUrlHistory(); const filtered = history.filter(item => item.id !== id); await AsyncStorage.setItem('url_history', JSON.stringify(filtered)); return filtered; } catch { return []; } };
export const clearUrlHistory = async () => { try { await AsyncStorage.removeItem('url_history'); } catch {} };

export default { validateMCQJson, normalizeJsonData, fetchJsonFromUrl, parseCustomJson, saveUrlHistory, getUrlHistory, deleteUrlHistoryItem, clearUrlHistory };
