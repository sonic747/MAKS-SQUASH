import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { SquashMember, FeedPost, ClubPushToken, ClubPushLog } from '../types';
import { INITIAL_MEMBERS } from '../data/initialData';

const MEMBERS_COLLECTION = 'club_members';
const POSTS_COLLECTION = 'club_posts';
const TOKENS_COLLECTION = 'club_push_tokens';
const PUSH_LOGS_COLLECTION = 'club_push_logs';
const META_DOC = 'club_metadata';

/**
 * Real-time listener for Members collection.
 */
export function subscribeToMembers(
  onUpdate: (members: SquashMember[]) => void,
  onError?: (error: Error) => void
): () => void {
  const membersRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    membersRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Only if database is genuinely empty, check metadata asynchronously
        const metaDocRef = doc(db, META_DOC, 'system');
        getDoc(metaDocRef)
          .then((metaSnap) => {
            const isInitialized = metaSnap.exists() && metaSnap.data()?.membersInitialized;
            if (!isInitialized) {
              seedInitialData().catch(() => {});
            } else {
              onUpdate([]);
            }
          })
          .catch(() => {
            onUpdate([]);
          });
        return;
      }

      const members: SquashMember[] = [];
      snapshot.forEach((docSnap) => {
        members.push(docSnap.data() as SquashMember);
      });

      // Sort members (admin & captain first, then name)
      members.sort((a, b) => {
        if (a.role === 'admin') return -1;
        if (b.role === 'admin') return 1;
        if (a.role === 'captain') return -1;
        if (b.role === 'captain') return 1;
        return a.name.localeCompare(b.name, 'ko');
      });

      // Immediately cache to localStorage for 0-latency instant hydration on next reload
      try {
        localStorage.setItem('maks_squash_members_cache_v1', JSON.stringify(members));
      } catch (e) {
        // quota ignore
      }

      onUpdate(members);
    },
    (err) => {
      console.error('Firestore subscribeToMembers error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Feed Posts collection.
 */
export function subscribeToPosts(
  onUpdate: (posts: FeedPost[]) => void,
  onError?: (error: Error) => void
): () => void {
  const postsRef = collection(db, POSTS_COLLECTION);
  return onSnapshot(
    postsRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      const posts: FeedPost[] = [];
      snapshot.forEach((docSnap) => {
        posts.push(docSnap.data() as FeedPost);
      });

      try {
        localStorage.setItem('maks_squash_posts_cache_v1', JSON.stringify(posts));
      } catch (e) {
        // quota ignore
      }

      onUpdate(posts);
    },
    (err) => {
      console.error('Firestore subscribeToPosts error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for registered push notification tokens
 */
export function subscribeToPushTokens(
  onUpdate: (tokens: ClubPushToken[]) => void,
  onError?: (error: Error) => void
): () => void {
  const tokensRef = collection(db, TOKENS_COLLECTION);
  return onSnapshot(
    tokensRef,
    (snapshot) => {
      const tokens: ClubPushToken[] = [];
      snapshot.forEach((d) => tokens.push(d.data() as ClubPushToken));
      onUpdate(tokens);
    },
    (err) => {
      console.error('Firestore subscribeToPushTokens error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save / Register device FCM push token into Firestore
 */
export async function savePushTokenToFirestore(pushToken: ClubPushToken): Promise<void> {
  const tokenDoc = doc(db, TOKENS_COLLECTION, pushToken.token);
  await setDoc(tokenDoc, JSON.parse(JSON.stringify(pushToken)), { merge: true });

  // Also update member's own record with token & pushEnabled flag
  if (pushToken.memberId) {
    const memberDoc = doc(db, MEMBERS_COLLECTION, pushToken.memberId);
    await setDoc(
      memberDoc,
      {
        fcmToken: pushToken.token,
        pushEnabled: true,
        pushSubscribedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

/**
 * Record a push broadcast log in Firestore
 */
export async function logPushBroadcast(log: ClubPushLog): Promise<void> {
  const logDoc = doc(db, PUSH_LOGS_COLLECTION, log.id);
  await setDoc(logDoc, JSON.parse(JSON.stringify(log)), { merge: true });
}

/**
 * Add or Update member in Firestore
 */
export async function saveMemberToFirestore(member: SquashMember): Promise<void> {
  const memberDoc = doc(db, MEMBERS_COLLECTION, member.id);
  const sanitized = JSON.parse(JSON.stringify(member));
  await setDoc(memberDoc, sanitized, { merge: true });
}

/**
 * Delete member from Firestore
 */
export async function deleteMemberFromFirestore(memberId: string): Promise<void> {
  const memberDoc = doc(db, MEMBERS_COLLECTION, memberId);
  await deleteDoc(memberDoc);
}

/**
 * Add or Update post in Firestore
 */
export async function savePostToFirestore(post: FeedPost): Promise<void> {
  const postDoc = doc(db, POSTS_COLLECTION, post.id);
  const sanitized = JSON.parse(JSON.stringify(post));
  await setDoc(postDoc, sanitized, { merge: true });
}

/**
 * Delete post from Firestore
 */
export async function deletePostFromFirestore(postId: string): Promise<void> {
  const postDoc = doc(db, POSTS_COLLECTION, postId);
  await deleteDoc(postDoc);
}

/**
 * Bulk import / restore all members and posts
 */
export async function syncAllToFirestore(
  members: SquashMember[],
  posts: FeedPost[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const m of members) {
    const mRef = doc(db, MEMBERS_COLLECTION, m.id);
    batch.set(mRef, JSON.parse(JSON.stringify(m)), { merge: true });
  }
  for (const p of posts) {
    const pRef = doc(db, POSTS_COLLECTION, p.id);
    batch.set(pRef, JSON.parse(JSON.stringify(p)), { merge: true });
  }
  await batch.commit();
}

/**
 * Seed initial data if Firestore is empty on first load
 */
async function seedInitialData() {
  try {
    const batch = writeBatch(db);
    for (const member of INITIAL_MEMBERS) {
      const docRef = doc(db, MEMBERS_COLLECTION, member.id);
      batch.set(docRef, JSON.parse(JSON.stringify(member)));
    }
    const metaDocRef = doc(db, META_DOC, 'system');
    batch.set(metaDocRef, { membersInitialized: true }, { merge: true });
    await batch.commit();
    console.log('Seeded initial members to Firestore');
  } catch (err) {
    console.error('Failed to seed initial members:', err);
  }
}
