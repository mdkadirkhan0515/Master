
/**
 * queries.js - PLAYER: subject_type filter + Random dictionary options + Progress
 */
import { getDb } from './db';

export const getAllChapters = async (subjectType = null) => {
  const db = await getDb();
  let query = `SELECT Chapter_id as id, Chapter_text as subject_text, Chapter_text, subject_type FROM chapters`;
  let params = [];
  if (subjectType) { query += ` WHERE LOWER(subject_type) = ?`; params.push(subjectType.toLowerCase()); }
  query += ` ORDER BY CAST(Chapter_id AS INTEGER) ASC, Chapter_id ASC`;
  return await db.getAllAsync(query, params);
};
export const getAllSubjects = getAllChapters;

export const getDictionaryCount = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT COUNT(*) as total FROM dictionary`);
  return row?.total || 0;
};

export const generateOptionsForQuestion = async (chapterId, questionId, dbInstance = null) => {
  const database = dbInstance || await getDb();
  const q = await database.getFirstAsync(`SELECT Answer_text, Answer_id FROM questions WHERE chapter_id = ? AND Question_id = ?`, [String(chapterId), parseInt(questionId, 10)]);
  if (!q) return [];
  const correctText = q.Answer_text;
  const correctId = q.Answer_id;
  const wrongOptions = await database.getAllAsync(`SELECT Dictionary_id, Dictionary_text FROM dictionary WHERE Dictionary_id != ? ORDER BY RANDOM() LIMIT 3`, [correctId || -1]);
  let allOptions = [{ Random_id: correctId || 999999, option_text: correctText, isCorrect: true, Dictionary_id: correctId }];
  for (const w of wrongOptions) allOptions.push({ Random_id: w.Dictionary_id, option_text: w.Dictionary_text, isCorrect: false, Dictionary_id: w.Dictionary_id });
  if (allOptions.length < 4) {
    const extra = await database.getAllAsync(`SELECT Dictionary_id, Dictionary_text FROM dictionary ORDER BY RANDOM() LIMIT ${4 - allOptions.length}`);
    for (const e of extra) if (!allOptions.find(o => o.Dictionary_id === e.Dictionary_id)) allOptions.push({ Random_id: e.Dictionary_id, option_text: e.Dictionary_text, isCorrect: false, Dictionary_id: e.Dictionary_id });
  }
  for (let i = allOptions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]]; }
  return allOptions.slice(0,4).map((opt, idx) => ({ Random_id: opt.Random_id, option_text: opt.option_text, isCorrect: opt.isCorrect, Dictionary_id: opt.Dictionary_id, label: ['A','B','C','D'][idx] }));
};

export const getQuestionsBySubjectId = async (chapterId) => {
  const db = await getDb();
  const questions = await db.getAllAsync(`SELECT chapter_id, Question_id as question_id, Question_text as question_text, Answer_text, Answer_id as correct_ans_id, chapter_id as subject_id, subject_type FROM questions WHERE chapter_id = ? ORDER BY Question_id ASC`, [String(chapterId)]);
  const fullData = [];
  for (const q of questions) {
    const options = await generateOptionsForQuestion(q.chapter_id, q.question_id, db);
    fullData.push({ question_id: `${q.chapter_id}_${q.question_id}`, composite_id: { chapter_id: q.chapter_id, Question_id: q.question_id }, subject_id: q.subject_id, chapter_id: q.chapter_id, Question_id: q.question_id, question_text: q.question_text, Answer_text: q.Answer_text, correct_ans_id: q.correct_ans_id, subject_type: q.subject_type, options });
  }
  return fullData;
};

export const getQuestionsWithProgress = async (chapterId) => {
  const db = await getDb();
  const rows = await db.getAllAsync(`SELECT q.chapter_id, q.Question_id, q.Question_text, q.Answer_text, q.Answer_id as correct_ans_id, p.is_wrong, p.is_correct, p.is_read, p.selected_option_id FROM questions q LEFT JOIN user_progress p ON q.chapter_id = p.chapter_id AND q.Question_id = p.Question_id WHERE q.chapter_id = ? ORDER BY q.Question_id ASC`, [String(chapterId)]);
  const fullData = [];
  for (const q of rows) {
    const options = await generateOptionsForQuestion(q.chapter_id, q.Question_id, db);
    fullData.push({ question_id: `${q.chapter_id}_${q.Question_id}`, composite_id: { chapter_id: q.chapter_id, Question_id: q.Question_id }, subject_id: q.chapter_id, chapter_id: q.chapter_id, Question_id: q.Question_id, question_text: q.Question_text, Answer_text: q.Answer_text, correct_ans_id: q.correct_ans_id, is_wrong: q.is_wrong || 0, is_correct: q.is_correct || 0, is_read: q.is_read || 0, selected_option_id: q.selected_option_id, options });
  }
  return fullData;
};

export const getSubjectProgress = async (chapterId) => {
  const db = await getDb();
  const totalRow = await db.getFirstAsync(`SELECT COUNT(*) as total FROM questions WHERE chapter_id = ?`, [String(chapterId)]);
  const progressRow = await db.getFirstAsync(`SELECT SUM(is_read) as readCount, SUM(is_correct) as correctCount, SUM(is_wrong) as wrongCount FROM user_progress WHERE chapter_id = ?`, [String(chapterId)]);
  return { total: totalRow?.total || 0, read: progressRow?.readCount || 0, correct: progressRow?.correctCount || 0, wrong: progressRow?.wrongCount || 0 };
};

export const markAsRead = async (questionId, chapterId) => {
  const db = await getDb();
  let chId = chapterId; let qId = questionId;
  if (String(questionId).includes('_')) { const parts = String(questionId).split('_'); chId = parts[0]; qId = parseInt(parts[1],10); }
  await db.runAsync(`UPDATE user_progress SET is_read = 1 WHERE chapter_id = ? AND Question_id = ?`, [String(chId), parseInt(qId,10)]);
};

export const markAnswer = async (questionId, chapterId, isCorrect, selectedOptionId = null) => {
  const db = await getDb();
  let chId = chapterId; let qId = questionId;
  if (String(questionId).includes('_')) { const parts = String(questionId).split('_'); chId = parts[0]; qId = parseInt(parts[1],10); }
  if (isCorrect) await db.runAsync(`UPDATE user_progress SET is_read = 1, is_correct = 1, is_wrong = 0, selected_option_id = ? WHERE chapter_id = ? AND Question_id = ?`, [selectedOptionId, String(chId), parseInt(qId,10)]);
  else await db.runAsync(`UPDATE user_progress SET is_read = 1, is_correct = 0, is_wrong = 1, selected_option_id = ? WHERE chapter_id = ? AND Question_id = ?`, [selectedOptionId, String(chId), parseInt(qId,10)]);
};

export const getWrongQuestionsBySubject = async (chapterId) => {
  const db = await getDb();
  const wrongList = await db.getAllAsync(`SELECT chapter_id, Question_id FROM user_progress WHERE chapter_id = ? AND is_wrong = 1`, [String(chapterId)]);
  const fullData = [];
  for (const w of wrongList) {
    const q = await db.getFirstAsync(`SELECT chapter_id, Question_id, Question_text, Answer_text, Answer_id FROM questions WHERE chapter_id = ? AND Question_id = ?`, [w.chapter_id, w.Question_id]);
    if (!q) continue;
    const options = await generateOptionsForQuestion(w.chapter_id, w.Question_id, db);
    fullData.push({ question_id: `${q.chapter_id}_${q.Question_id}`, composite_id: { chapter_id: q.chapter_id, Question_id: q.Question_id }, subject_id: q.chapter_id, question_text: q.Question_text, correct_ans_id: q.Answer_id, options });
  }
  return fullData;
};

export const getFilteredQuestions = async (chapterId) => {
  const db = await getDb();
  const rows = await db.getAllAsync(`SELECT q.chapter_id, q.Question_id, q.Question_text, q.Answer_text, q.Answer_id as correct_ans_id, p.is_wrong, p.is_correct, p.is_read, p.selected_option_id FROM questions q LEFT JOIN user_progress p ON q.chapter_id = p.chapter_id AND q.Question_id = p.Question_id WHERE q.chapter_id = ? ORDER BY p.is_wrong DESC, p.is_correct ASC, q.Question_id ASC`, [String(chapterId)]);
  const fullData = [];
  for (const q of rows) {
    const options = await generateOptionsForQuestion(q.chapter_id, q.Question_id, db);
    fullData.push({ question_id: `${q.chapter_id}_${q.Question_id}`, composite_id: { chapter_id: q.chapter_id, Question_id: q.Question_id }, subject_id: q.chapter_id, chapter_id: q.chapter_id, Question_id: q.Question_id, question_text: q.Question_text, correct_ans_id: q.correct_ans_id, is_wrong: q.is_wrong, is_correct: q.is_correct, selected_option_id: q.selected_option_id, options });
  }
  return fullData;
};

export const resetProgressBySubject = async (chapterId) => {
  const db = await getDb();
  await db.runAsync(`UPDATE user_progress SET is_read = 0, is_correct = 0, is_wrong = 0, selected_option_id = NULL WHERE chapter_id = ?`, [String(chapterId)]);
};

export default { getAllChapters, getAllSubjects, getQuestionsBySubjectId, getQuestionsWithProgress, getSubjectProgress, markAsRead, markAnswer, getWrongQuestionsBySubject, getFilteredQuestions, resetProgressBySubject, generateOptionsForQuestion, getDictionaryCount };
