import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';

export interface PersistedChatSession {
  id: string;
  userId: string;
  title: string;
  systemRole: 'academic_tutor' | 'socratic_mentor' | 'exam_prepper' | 'diagram_explainer';
  model: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
  searchGroundingEnabled: boolean;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  searchSources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
  timestamp: string;
}

export interface PersistedUserStudy {
  id: string;
  userId: string;
  lessonId: string;
  masteryScore: number;
  studyMinutes: number;
  flashcardsReviewed: number;
  bookmarkedEvidenceIds: string[];
  notes?: string;
  updatedAt: string;
}

/**
 * Save or update a chat session in Firestore
 */
export async function saveChatSession(session: PersistedChatSession): Promise<void> {
  try {
    const sessionRef = doc(db, 'chat_sessions', session.id);
    await setDoc(sessionRef, session, { merge: true });
  } catch (err) {
    console.warn('Firestore: Could not save chat session:', err);
  }
}

/**
 * Fetch all chat sessions for a user
 */
export async function fetchUserChatSessions(userId: string): Promise<PersistedChatSession[]> {
  try {
    const q = query(
      collection(db, 'chat_sessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PersistedChatSession);
  } catch (err) {
    console.warn('Firestore: Could not fetch chat sessions:', err);
    return [];
  }
}

/**
 * Save a message to a chat session's subcollection
 */
export async function saveChatMessage(
  sessionId: string,
  message: PersistedChatMessage
): Promise<void> {
  try {
    const msgRef = doc(db, 'chat_sessions', sessionId, 'messages', message.id);
    await setDoc(msgRef, message);

    // Update parent session updatedAt
    const sessionRef = doc(db, 'chat_sessions', sessionId);
    await setDoc(sessionRef, { updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Firestore: Could not save chat message:', err);
  }
}

/**
 * Fetch messages for a chat session
 */
export async function fetchChatMessages(sessionId: string): Promise<PersistedChatMessage[]> {
  try {
    const q = query(
      collection(db, 'chat_sessions', sessionId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PersistedChatMessage);
  } catch (err) {
    console.warn('Firestore: Could not fetch chat messages:', err);
    return [];
  }
}

/**
 * Save user study analytics and notes to Firestore
 */
export async function saveUserStudyProgress(study: PersistedUserStudy): Promise<void> {
  try {
    const studyRef = doc(db, 'user_studies', `${study.userId}_${study.lessonId}`);
    await setDoc(studyRef, {
      ...study,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore: Could not save study progress:', err);
  }
}

/**
 * Fetch user study progress for a lesson
 */
export async function fetchUserStudyProgress(
  userId: string,
  lessonId: string
): Promise<PersistedUserStudy | null> {
  try {
    const studyRef = doc(db, 'user_studies', `${userId}_${lessonId}`);
    const snap = await getDoc(studyRef);
    if (snap.exists()) {
      return snap.data() as PersistedUserStudy;
    }
    return null;
  } catch (err) {
    console.warn('Firestore: Could not fetch study progress:', err);
    return null;
  }
}
