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
import { SquashMember, FeedPost } from '../types';
import { INITIAL_MEMBERS } from '../data/initialData';

const MEMBERS_COLLECTION = 'club_members';
const POSTS_COLLECTION = 'club_posts';
const META_DOC = 'club_metadata';

/**
 * Real-time listener for Members collection.
 * Triggers callback immediately and on every remote change (Add, Update, Delete) from any device (Mobile or PC).
 */
export function subscribeToMembers(
  onUpdate: (members: SquashMember[]) => void,
  onError?: (error: Error) => void
): () => void {
  const membersRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    membersRef,
    async (snapshot) => {
      const metaDocRef = doc(db, META_DOC, 'system');
      const metaSnap = await getDoc(metaDocRef);
      const isInitialized = metaSnap.exists() && metaSnap.data()?.membersInitialized;

      if (snapshot.empty) {
        if (!isInitialized) {
          // If Firestore is brand new empty, seed initial members once
          await seedInitialData();
          return;
        } else {
          onUpdate([]);
          return;
        }
      }

      if (!isInitialized) {
        setDoc(metaDocRef, { membersInitialized: true }, { merge: true }).catch(() => {});
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
 * Pure real-time reflection of Firestore: NEVER re-seeds initial posts when empty.
 * Deleting posts guarantees permanent deletion across Mobile and PC.
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
      onUpdate(posts);
    },
    (err) => {
      console.error('Firestore subscribeToPosts error:', err);
      if (onError) onError(err);
    }
  );
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
 * Delete member from Firestore (Real-time removes on both Mobile & PC)
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
