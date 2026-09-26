/**
 * ttsEngine.js - PLAYER: Background audio, 8 modes, Pair Toggle
 * expo-speech + expo-audio staysActiveInBackground true
 * Modes: q-iiii, q-iiii-GS (pair 1), q-A, q-A-GS (pair 2), M-iiii, A-A (pair 3), tree-q, rest (pair 4)
 */
import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';

let config = { rate: 1.0, pitch: 1.0, delayQuestionToOption: 500, delayCardToCard: 1200, language: 'bn-BD', voice: null };
let isSpeaking = false;
let shouldStop = false;

export const initAudioMode = async () => {
  try { await setAudioModeAsync({ staysActiveInBackground: true, shouldDuckAndroid: true, playThroughEarpieceAndroid: false, allowsRecording: false, playsInSilentMode: true }); } catch (e) { console.log('Audio mode error', e); }
};

export const updateTTSConfig = (newConfig) => { config = { ...config, ...newConfig }; };
export const getTTSConfig = () => config;
export const stopTTS = async () => { shouldStop = true; isSpeaking = false; try { await Speech.stop(); } catch {} };

const speakText = (text, options = {}) => {
  return new Promise((resolve) => {
    if (shouldStop || !text) { resolve(); return; }
    Speech.speak(text, { language: options.language || config.language, pitch: options.pitch ?? config.pitch, rate: options.rate ?? config.rate, voice: config.voice || undefined, onDone: () => resolve(), onStopped: () => resolve(), onError: () => resolve() });
  });
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const cleanForTTS = (text) => String(text || '').trim();

export const speak_q_iiii = async (questionData) => {
  if (!questionData) return;
  shouldStop = false; isSpeaking = true;
  await speakText(cleanForTTS(questionData.question_text));
  if (shouldStop) return;
  await delay(config.delayQuestionToOption);
  for (let i=0;i<questionData.options.length;i++) {
    if (shouldStop) break;
    const opt = questionData.options[i];
    const label = ['A','B','C','D'][i] || '';
    await speakText(`Option ${label}: ${cleanForTTS(opt.option_text)}`);
    if (shouldStop) break;
    await delay(300);
  }
  isSpeaking = false;
};

export const speak_q_A = async (questionData) => {
  if (!questionData) return;
  shouldStop = false; isSpeaking = true;
  await speakText(cleanForTTS(questionData.question_text));
  if (shouldStop) return;
  await delay(config.delayQuestionToOption);
  const correctOpt = questionData.options.find(o => o.isCorrect);
  if (correctOpt) await speakText(`Correct answer: ${cleanForTTS(correctOpt.option_text)}`);
  isSpeaking = false;
};

export const speak_q_iiii_GS = async (questionsList, startIndex, onNext) => {
  shouldStop = false;
  for (let i=startIndex;i<questionsList.length;i++) { if (shouldStop) break; if (onNext) onNext(i); await speak_q_iiii(questionsList[i]); if (shouldStop) break; await delay(config.delayCardToCard); }
};

export const speak_q_A_GS = async (questionsList, startIndex, onNext) => {
  shouldStop = false;
  for (let i=startIndex;i<questionsList.length;i++) { if (shouldStop) break; if (onNext) onNext(i); await speak_q_A(questionsList[i]); if (shouldStop) break; await delay(config.delayCardToCard); }
};

export const isManualMode = (mode) => ['M-iiii','A-A','tree-q','rest'].includes(mode);
export const getIsSpeaking = () => isSpeaking;
export default { initAudioMode, updateTTSConfig, getTTSConfig, stopTTS, speak_q_iiii, speak_q_A, speak_q_iiii_GS, speak_q_A_GS, isManualMode, getIsSpeaking };
