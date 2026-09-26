
/**
 * db.js - PLAYER ARCHITECTURE FINAL
 * - subject_type: bangla / english separation
 * - Dictionary: Dictionary_id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE COLLATE NOCASE
 * - Chapters: Chapter_id TEXT PRIMARY KEY + subject_type
 * - Questions: COMPOSITE PK (chapter_id, Question_id) => 01_1, 01_2
 * - Auto Integer per chapter + Dictionary relation via Answer_id
 * - Append logic, Rename/Delete per chapter
 */
import * as SQLite from 'expo-sqlite';

let db = null;

export const getDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('mcq.db');
  return db;
};

export const initDatabase = async () => {
  const database = await getDb();
  try {
    const qInfo = await database.getAllAsync(`PRAGMA table_info(questions)`);
    if (qInfo.length > 0) {
      const hasChapterId = qInfo.some(c => c.name === 'chapter_id');
      const hasComposite = qInfo.filter(c => c.pk > 0).length > 1;
      if (!hasChapterId || !hasComposite) {
        await database.execAsync(`PRAGMA foreign_keys = OFF; DROP TABLE IF EXISTS user_progress; DROP TABLE IF EXISTS ans_id; DROP TABLE IF EXISTS options; DROP TABLE IF EXISTS questions; PRAGMA foreign_keys = ON;`);
      } else {
        if (!qInfo.some(c => c.name === 'subject_type')) await database.execAsync(`ALTER TABLE questions ADD COLUMN subject_type TEXT DEFAULT 'bangla'`);
      }
    }
    const chInfo = await database.getAllAsync(`PRAGMA table_info(chapters)`);
    if (chInfo.length > 0 && !chInfo.some(c => c.name === 'subject_type')) await database.execAsync(`ALTER TABLE chapters ADD COLUMN subject_type TEXT DEFAULT 'bangla'`);
    const sInfo = await database.getAllAsync(`PRAGMA table_info(subjects)`);
    if (sInfo.length > 0 && !sInfo.some(c => c.name === 'subject_type')) await database.execAsync(`ALTER TABLE subjects ADD COLUMN subject_type TEXT DEFAULT 'bangla'`);
    const pInfo = await database.getAllAsync(`PRAGMA table_info(user_progress)`);
    if (pInfo.length > 0 && !pInfo.some(c => c.name === 'selected_option_id')) await database.execAsync(`ALTER TABLE user_progress ADD COLUMN selected_option_id INTEGER`);
  } catch (e) { console.log('Migration', e); }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS dictionary (
      Dictionary_id INTEGER PRIMARY KEY AUTOINCREMENT,
      Dictionary_text TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      Chapter_id TEXT PRIMARY KEY NOT NULL,
      Chapter_text TEXT NOT NULL,
      subject_type TEXT DEFAULT 'bangla',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      subject_text TEXT NOT NULL,
      subject_type TEXT DEFAULT 'bangla'
    );

    CREATE TABLE IF NOT EXISTS questions (
      chapter_id TEXT NOT NULL,
      Question_id INTEGER NOT NULL,
      Question_text TEXT NOT NULL,
      Answer_text TEXT NOT NULL,
      Answer_id INTEGER,
      subject_type TEXT DEFAULT 'bangla',
      PRIMARY KEY (chapter_id, Question_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(Chapter_id) ON DELETE CASCADE,
      FOREIGN KEY (Answer_id) REFERENCES dictionary(Dictionary_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS options (
      Random_id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id TEXT NOT NULL,
      Question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      Dictionary_id INTEGER,
      FOREIGN KEY (chapter_id, Question_id) REFERENCES questions(chapter_id, Question_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ans_id (
      chapter_id TEXT NOT NULL,
      Question_id INTEGER NOT NULL,
      ans_id INTEGER NOT NULL,
      PRIMARY KEY (chapter_id, Question_id),
      FOREIGN KEY (chapter_id, Question_id) REFERENCES questions(chapter_id, Question_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      chapter_id TEXT NOT NULL,
      Question_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_correct INTEGER DEFAULT 0,
      is_wrong INTEGER DEFAULT 0,
      selected_option_id INTEGER,
      PRIMARY KEY (chapter_id, Question_id),
      FOREIGN KEY (chapter_id, Question_id) REFERENCES questions(chapter_id, Question_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chapters_type ON chapters(subject_type);
    CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(subject_type);
    CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_dict_text ON dictionary(Dictionary_text);
  `);
  return database;
};

export const clearAllData = async () => {
  const database = await getDb();
  await database.execAsync(`DELETE FROM user_progress; DELETE FROM ans_id; DELETE FROM options; DELETE FROM questions; DELETE FROM dictionary; DELETE FROM chapters; DELETE FROM subjects;`);
  await database.execAsync(`DELETE FROM sqlite_sequence WHERE name IN ('dictionary','options')`);
};

export const deleteChapter = async (chapterId) => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM questions WHERE chapter_id = ?`, [String(chapterId)]);
  await db.runAsync(`DELETE FROM user_progress WHERE chapter_id = ?`, [String(chapterId)]);
  await db.runAsync(`DELETE FROM chapters WHERE Chapter_id = ?`, [String(chapterId)]);
  await db.runAsync(`DELETE FROM subjects WHERE id = ?`, [String(chapterId)]);
};

export const renameChapter = async (chapterId, newName) => {
  const db = await getDb();
  await db.runAsync(`UPDATE chapters SET Chapter_text = ? WHERE Chapter_id = ?`, [newName, String(chapterId)]);
  await db.runAsync(`UPDATE subjects SET subject_text = ? WHERE id = ?`, [newName, String(chapterId)]);
};

export const getOrCreateDictionaryId = async (text, dbInstance = null) => {
  const database = dbInstance || await getDb();
  const clean = String(text || '').trim();
  if (!clean) return null;
  const existing = await database.getFirstAsync(`SELECT Dictionary_id FROM dictionary WHERE Dictionary_text = ? COLLATE NOCASE LIMIT 1`, [clean]);
  if (existing) return existing.Dictionary_id;
  const res = await database.runAsync(`INSERT INTO dictionary (Dictionary_text) VALUES (?)`, [clean]);
  return res.lastInsertRowId;
};

export const insertCustomData = async (jsonData, subjectType = 'bangla') => {
  const database = await getDb();
  let dictionaries = jsonData.dictionary || [];
  let chapters = jsonData.chapters || [];
  let questions = jsonData.questions || [];
  const sType = (subjectType || jsonData.subject_type || 'bangla').toLowerCase();

  chapters = chapters.map(c => ({
    Chapter_id: String(c.chapter_Id || c.Chapter_id || c.chapter_id || c.id || '').trim(),
    Chapter_text: c.Chapter_text || c.chapter_text || c.subject_text || '',
    subject_type: (sType || c.subject_type || 'bangla').toLowerCase()
  })).filter(c => c.Chapter_id);

  dictionaries = dictionaries.map(d => ({
    Dictionary_id: d.Dictionary_id ? parseInt(d.Dictionary_id, 10) : null,
    Dictionary_text: String(d.Dictionary_text || d.dictionary_text || '').trim()
  })).filter(d => d.Dictionary_text);

  let normalizedQuestions = [];
  const chapterQuestionCount = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    let chId = String(q.chapter_id || q.Chapter_id || q.chapter_Id || '').trim();
    let qId = q.Question_id || q.question_id ? parseInt(q.Question_id || q.question_id, 10) : null;
    const qText = String(q.Question_text || q.question_text || '').trim();
    const aText = String(q.Answer_text || q.answer_text || '').trim();
    if (!qText) continue;
    if (!chId) {
      if (chapters.length > 0) {
        const perChapter = Math.ceil(questions.length / chapters.length);
        const chapterIndex = Math.floor(i / perChapter);
        chId = chapters[Math.min(chapterIndex, chapters.length - 1)].Chapter_id;
      } else chId = "01";
    }
    if (!qId) {
      if (!chapterQuestionCount[chId]) {
        const maxRow = await database.getFirstAsync(`SELECT MAX(Question_id) as maxId FROM questions WHERE chapter_id = ?`, [chId]);
        chapterQuestionCount[chId] = (maxRow?.maxId || 0);
      }
      chapterQuestionCount[chId] += 1;
      qId = chapterQuestionCount[chId];
    }
    normalizedQuestions.push({ chapter_id: chId, Question_id: qId, Question_text: qText, Answer_text: aText, subject_type: sType });

  }

  await database.withTransactionAsync(async () => {
    for (const dict of dictionaries) {
      const txt = String(dict.Dictionary_text).trim();
      if (!txt) continue;
      if (dict.Dictionary_id) await database.runAsync(`INSERT OR REPLACE INTO dictionary (Dictionary_id, Dictionary_text) VALUES (?, ?)`, [dict.Dictionary_id, txt]);
      else await database.runAsync(`INSERT OR IGNORE INTO dictionary (Dictionary_text) VALUES (?)`, [txt]);
    }
    for (const ch of chapters) {
      if (!ch.Chapter_id) continue;
      await database.runAsync(`INSERT OR REPLACE INTO chapters (Chapter_id, Chapter_text, subject_type) VALUES (?, ?, ?)`, [ch.Chapter_id, ch.Chapter_text, ch.subject_type || sType]);
      await database.runAsync(`INSERT OR REPLACE INTO subjects (id, subject_text, subject_type) VALUES (?, ?, ?)`, [ch.Chapter_id, ch.Chapter_text, ch.subject_type || sType]);
    }
    for (const q of normalizedQuestions) {
      const ansId = await getOrCreateDictionaryId(q.Answer_text, database);
      await database.runAsync(`INSERT OR REPLACE INTO questions (chapter_id, Question_id, Question_text, Answer_text, Answer_id, subject_type) VALUES (?, ?, ?, ?, ?, ?)`, [q.chapter_id, q.Question_id, q.Question_text, q.Answer_text, ansId, q.subject_type]);
      await database.runAsync(`INSERT OR IGNORE INTO user_progress (chapter_id, Question_id) VALUES (?, ?)`, [q.chapter_id, q.Question_id]);
      if (ansId) await database.runAsync(`INSERT OR REPLACE INTO ans_id (chapter_id, Question_id, ans_id) VALUES (?, ?, ?)`, [q.chapter_id, q.Question_id, ansId]);
    }
  });
  return { dictionaries: dictionaries.length, chapters: chapters.length, questions: normalizedQuestions.length };
};

export const insertSubjectData = async (jsonArray, subjectType = 'bangla') => {
  const database = await getDb();
  const sType = subjectType.toLowerCase();
  await database.withTransactionAsync(async () => {
    for (const subject of jsonArray) {
      const chId = String(subject.id || subject.Chapter_id || '').trim();
      const chText = subject.subject_text || subject.Chapter_text || '';
      if (!chId) continue;
      await database.runAsync(`INSERT OR REPLACE INTO chapters (Chapter_id, Chapter_text, subject_type) VALUES (?, ?, ?)`, [chId, chText, sType]);
      await database.runAsync(`INSERT OR REPLACE INTO subjects (id, subject_text, subject_type) VALUES (?, ?, ?)`, [chId, chText, sType]);
      if (!subject.questions) continue;
      let qCount = 0;
      for (const q of subject.questions) {
        qCount++;
        const qId = q.question_id ? parseInt(q.question_id, 10) : qCount;
        const qText = q.question_text || q.Question_text || '';
        const aText = q.Answer_text || q.answer_text || '';
        const ansId = await getOrCreateDictionaryId(aText, database);
        await database.runAsync(`INSERT OR REPLACE INTO questions (chapter_id, Question_id, Question_text, Answer_text, Answer_id, subject_type) VALUES (?, ?, ?, ?, ?, ?)`, [chId, qId, qText, aText, ansId, sType]);
        await database.runAsync(`INSERT OR IGNORE INTO user_progress (chapter_id, Question_id) VALUES (?, ?)`, [chId, qId]);
      }
    }
  });
};

export default { getDb, initDatabase, clearAllData, deleteChapter, renameChapter, insertCustomData, insertSubjectData, getOrCreateDictionaryId };
