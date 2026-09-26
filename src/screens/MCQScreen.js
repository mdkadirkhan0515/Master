/**
 * MCQScreen.js - Compact Guide Book + Sub-Header Toolbar
 * - Thin divider, 6-8 questions per screen
 * - Sub-header icon toolbar with long-press tooltip
 * - Font scale A-/A+ with 3 levels: small/medium/large
 * - Left accent strip feedback
 * - Entire card touch audio, pause/resume, auto carousel
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MCQCard from '../components/MCQCard';
import SubHeaderToolbar from '../components/SubHeaderToolbar';
import {
  getQuestionsBySubjectId,
  getFilteredQuestions,
  getWrongQuestionsBySubject,
  resetProgressBySubject,
} from '../database/queries';
import {
  initAudioMode,
  stopTTS,
  getTTSConfig,
} from '../utils/ttsEngine';
import * as Speech from 'expo-speech';
import { getTheme } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MODE_TITLES = {
  'q-iiii': 'Full Audio',
  'q-iiii-GS': 'Auto Full',
  'q-A': 'Quick Audio',
  'q-A-GS': 'Auto Quick',
  'M-iiii': 'Manual',
  'A-A': 'Mistakes First',
  'tree-q': 'Retry',
  'rest': 'Reset',
};

const MCQScreen = ({ themeMode = 'dark' }) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { subjectId, subjectText } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [activeMode, setActiveMode] = useState('M-iiii');
  const [answers, setAnswers] = useState({});
  const [playingIndex, setPlayingIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoIndex, setAutoIndex] = useState(0);
  const [fontScale, setFontScale] = useState('medium');

  const flatListRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const theme = getTheme(themeMode);
  const shouldStopRef = useRef(false);

  useEffect(() => {
    initAudioMode();
    loadQuestions();
    loadFontScale();
    setAnswers({});
    setPlayingIndex(null);
    return () => {
      stopTTS();
      shouldStopRef.current = true;
    };
  }, [subjectId]);

  const loadFontScale = async () => {
    try {
      const saved = await AsyncStorage.getItem('font_scale');
      if (saved && ['small','medium','large'].includes(saved)) {
        setFontScale(saved);
      }
    } catch {}
  };

  const handleFontChange = async (scale) => {
    setFontScale(scale);
    try { await AsyncStorage.setItem('font_scale', scale); } catch {}
  };

  const loadQuestions = async () => {
    try {
      const data = await getQuestionsBySubjectId(subjectId);
      setQuestions(data);
      setOriginalQuestions(data);
      setAnswers({});
    } catch (e) {
      console.log('loadQuestions error', e);
    }
  };

  const speakWithPromise = (text, lang = 'en-US') => {
    return new Promise((resolve) => {
      if (shouldStopRef.current) { resolve(); return; }
      Speech.speak(text, {
        language: getTTSConfig().language || lang,
        rate: getTTSConfig().rate || 1.0,
        pitch: getTTSConfig().pitch || 1.0,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const playFullAudio = async (q) => {
    if (shouldStopRef.current) return;
    const lang = q.subject_type === 'bangla' ? 'bn-BD' : 'en-US';
    await speakWithPromise(q.question_text, lang);
    if (shouldStopRef.current) return;
    await sleep(getTTSConfig().delayQuestionToOption || 500);
    for (let i = 0; i < q.options.length; i++) {
      if (shouldStopRef.current) return;
      while (isPaused) await sleep(100);
      const opt = q.options[i];
      const label = ['ক', 'খ', 'গ', 'ঘ'][i] || ['A','B','C','D'][i];
      await speakWithPromise(`${label}: ${opt.option_text}`, lang);
      await sleep(200);
    }
    if (shouldStopRef.current) return;
    const correct = q.options.find((o) => o.isCorrect);
    if (correct) await speakWithPromise(`সঠিক উত্তর: ${correct.option_text}`, lang);
  };

  const playQA = async (q) => {
    if (shouldStopRef.current) return;
    const lang = q.subject_type === 'bangla' ? 'bn-BD' : 'en-US';
    await speakWithPromise(q.question_text, lang);
    if (shouldStopRef.current) return;
    await sleep(400);
    const correct = q.options.find((o) => o.isCorrect);
    if (correct) await speakWithPromise(`উত্তর: ${correct.option_text}`, lang);
  };

  const startAutoCarousel = async (startIdx, mode) => {
    shouldStopRef.current = false;
    setIsAutoMode(true);
    setAutoIndex(startIdx);
    for (let i = startIdx; i < questions.length; i++) {
      if (shouldStopRef.current) break;
      setAutoIndex(i);
      setPlayingIndex(questions[i].question_id);
      slideAnim.setValue(-SCREEN_WIDTH);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      if (mode === 'q-iiii-GS') await playFullAudio(questions[i]);
      else await playQA(questions[i]);
      if (shouldStopRef.current) break;
      Animated.timing(slideAnim, { toValue: SCREEN_WIDTH, duration: 300, useNativeDriver: true }).start();
      await sleep(getTTSConfig().delayCardToCard || 1200);
    }
    setIsAutoMode(false);
    setPlayingIndex(null);
  };

  const handleCardPress = async (question, index) => {
    const isAudioMode = ['q-iiii', 'q-A'].includes(activeMode);
    if (!isAudioMode) return;
    if (playingIndex === question.question_id) {
      if (isPaused) {
        setIsPaused(false);
        shouldStopRef.current = false;
        if (activeMode === 'q-iiii') await playFullAudio(question);
        else await playQA(question);
        setPlayingIndex(null);
      } else {
        setIsPaused(true);
        await Speech.stop();
      }
    } else {
      shouldStopRef.current = false;
      setIsPaused(false);
      setPlayingIndex(question.question_id);
      if (activeMode === 'q-iiii') await playFullAudio(question);
      else await playQA(question);
      setPlayingIndex(null);
    }
  };

  const handleSelectOption = async (question, option) => {
    if (activeMode !== 'M-iiii' && activeMode !== 'tree-q' && activeMode !== 'A-A') return;
    setAnswers((prev) => ({ ...prev, [question.question_id]: option.Random_id }));
  };

  const handleModeChange = async (mode) => {
    await stopTTS();
    shouldStopRef.current = true;
    if (mode !== activeMode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (mode === 'M-iiii') setAnswers({});
    }
    setActiveMode(mode);
    setPlayingIndex(null);
    setIsPaused(false);
    setIsAutoMode(false);
    shouldStopRef.current = false;

    switch (mode) {
      case 'M-iiii':
        setQuestions(originalQuestions);
        setAnswers({});
        break;
      case 'q-iiii':
      case 'q-A':
        break;
      case 'q-iiii-GS':
        startAutoCarousel(0, 'q-iiii-GS');
        break;
      case 'q-A-GS':
        startAutoCarousel(0, 'q-A-GS');
        break;
      case 'A-A':
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const filtered = await getFilteredQuestions(subjectId);
        filtered.sort((a, b) => {
          const aAns = answers[a.question_id];
          const bAns = answers[b.question_id];
          const aWrong = aAns && a.options?.find(o => o.Random_id === aAns && !o.isCorrect);
          const bWrong = bAns && b.options?.find(o => o.Random_id === bAns && !o.isCorrect);
          if (aWrong && !bWrong) return -1;
          if (!aWrong && bWrong) return 1;
          return 0;
        });
        setQuestions(filtered);
        break;
      case 'tree-q':
        const wrongOnly = await getWrongQuestionsBySubject(subjectId);
        if (wrongOnly.length === 0) {
          Alert.alert('No mistakes', 'Great job!');
          setActiveMode('M-iiii');
        } else {
          setQuestions(wrongOnly);
          setAnswers({});
        }
        break;
      case 'rest':
        await resetProgressBySubject(subjectId);
        const fresh = await getQuestionsBySubjectId(subjectId);
        setQuestions(fresh);
        setOriginalQuestions(fresh);
        setAnswers({});
        setActiveMode('M-iiii');
        break;
      default:
        break;
    }
  };

  const renderItem = ({ item, index }) => {
    const selectedId = answers[item.question_id] || null;
    const showResult = activeMode === 'A-A' && !!selectedId;
    const isPlaying = playingIndex === item.question_id;

    if (isAutoMode) {
      if (index !== autoIndex) return null;
      return (
        <Animated.View style={{ transform: [{ translateX: slideAnim }], width: SCREEN_WIDTH - 16, alignSelf: 'center', marginTop: 40 }}>
          <MCQCard question={item} options={item.options} themeMode={themeMode} index={index} activeMode={activeMode} isPlaying={isPlaying} fontScale={fontScale} onCardPress={() => handleCardPress(item, index)} />
          <View style={styles.autoProgress}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressBarFill, { width: `${((autoIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.autoProgressText, { color: theme.textSecondary }]}>{autoIndex + 1} / {questions.length} • Tap to {isPaused ? 'resume' : 'pause'}</Text>
          </View>
        </Animated.View>
      );
    }

    return (
      <MCQCard
        question={item}
        options={item.options}
        selectedId={selectedId}
        showResult={showResult}
        onSelectOption={(opt) => handleSelectOption(item, opt)}
        themeMode={themeMode}
        index={index}
        activeMode={activeMode}
        onCardPress={() => handleCardPress(item, index)}
        isPlaying={isPlaying}
        disabled={showResult}
        fontScale={fontScale}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header: Entire row clickable */}
      <TouchableOpacity
        style={[styles.topBar, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}
        onPress={() => { stopTTS(); shouldStopRef.current = true; navigation.goBack(); }}
        activeOpacity={0.8}
      >
        <View style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </View>
        <View style={styles.topTitleBox}>
          <Text style={[styles.topTitle, { color: theme.textPrimary }]} numberOfLines={1}>{subjectText || `Unit ${subjectId}`}</Text>
          <Text style={[styles.topSub, { color: theme.textSecondary }]}>{questions.length} Q • {MODE_TITLES[activeMode]} • Font: {fontScale}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.countText, { color: theme.primary }]}>{questions.length}</Text>
        </View>
      </TouchableOpacity>

      {/* Sub-Header Toolbar - Icon only with tooltip + font control */}
      <SubHeaderToolbar activeMode={activeMode} onSelectMode={handleModeChange} themeMode={themeMode} fontScale={fontScale} onFontChange={handleFontChange} />

      {isAutoMode ? (
        <View style={styles.carouselContainer}>
          {questions[autoIndex] && (
            <Animated.View style={{ transform: [{ translateX: slideAnim }], width: SCREEN_WIDTH - 16, alignSelf: 'center', marginTop: 30 }}>
              <MCQCard question={questions[autoIndex]} options={questions[autoIndex].options} themeMode={themeMode} index={autoIndex} activeMode={activeMode} isPlaying={playingIndex === questions[autoIndex].question_id} fontScale={fontScale} onCardPress={() => { if (isPaused) setIsPaused(false); else { setIsPaused(true); Speech.stop(); } }} />
              <View style={styles.autoProgress}>
                <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                  <View style={[styles.progressBarFill, { width: `${((autoIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
                </View>
                <Text style={[styles.autoProgressText, { color: theme.textSecondary }]}>{autoIndex + 1} / {questions.length}</Text>
              </View>
            </Animated.View>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={questions}
          keyExtractor={(item) => String(item.question_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {}}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  topTitleBox: { flex: 1, marginHorizontal: 8 },
  topTitle: { fontSize: 13, fontWeight: '600' },
  topSub: { fontSize: 10, marginTop: 1 },
  countBadge: { minWidth: 28, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  countText: { fontSize: 11, fontWeight: '700' },
  listContent: { paddingBottom: 20 },
  carouselContainer: { flex: 1, alignItems: 'center' },
  autoProgress: { alignItems: 'center', marginTop: 16, gap: 6 },
  autoProgressText: { fontSize: 11, fontWeight: '500' },
  progressBarBg: { width: 180, height: 3, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
});

export default MCQScreen;
