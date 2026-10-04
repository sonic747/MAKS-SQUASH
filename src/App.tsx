import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MemberSidebar } from './components/MemberSidebar';
import { Navigation } from './components/Navigation';
import { FeedView } from './components/FeedView';
import { TrophyRoomView } from './components/TrophyRoomView';
import { RegisterView } from './components/RegisterView';
import { BackupView } from './components/BackupView';
import { MembersView } from './components/MembersView';
import { CreatePostModal } from './components/CreatePostModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { AddCheerModal } from './components/AddCheerModal';
import { AddHonorOrPhotoModal } from './components/AddHonorOrPhotoModal';
import { LightboxModal } from './components/LightboxModal';
import { EditPostModal } from './components/EditPostModal';
import { AuthGateModal } from './components/AuthGateModal';
import { EditProfileModal } from './components/EditProfileModal';
import { PWAInstallModal } from './components/PWAInstallModal';

import { INITIAL_MEMBERS, INITIAL_POSTS } from './data/initialData';
import { TabType, SquashMember, FeedPost, HonorItem, MemberPhoto } from './types';
import {
  subscribeToMembers,
  subscribeToPosts,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
  savePostToFirestore,
  deletePostFromFirestore,
  syncAllToFirestore,
} from './services/firestoreService';
import {
  registerPWAServiceWorker,
  isStandalonePWA,
} from './firebase';
import { usePWAInstall } from './hooks/usePWAInstall';
import { updateAppBadge, clearAppBadge } from './utils/appBadge';

const STORAGE_KEY_AUTH = 'maks_squash_current_user_v5';
const STORAGE_KEY_MEMBERS_CACHE = 'maks_squash_members_cache_v1';
const STORAGE_KEY_POSTS_CACHE = 'maks_squash_posts_cache_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudConnected, setCloudConnected] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    // If we have cached data, we can render immediately without blocking loading
    return !localStorage.getItem(STORAGE_KEY_MEMBERS_CACHE);
  });

  // Members & Posts State: Initialize from actual cached Firestore data, never flash stale INITIAL_MEMBERS
  const [members, setMembers] = useState<SquashMember[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_MEMBERS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading members cache:', e);
    }
    return [];
  });

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_POSTS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading posts cache:', e);
    }
    return [];
  });

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<SquashMember | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name?.includes('카카오') || parsed.username?.startsWith('kakao_')) {
          localStorage.removeItem(STORAGE_KEY_AUTH);
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load auth user', e);
    }
    return null;
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string>('m1');
  const [maxCapacity] = useState<number>(20);

  // Modals
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<FeedPost | null>(null);
  const [isCheerModalOpen, setIsCheerModalOpen] = useState(false);
  const [isAddHonorPhotoModalOpen, setIsAddHonorPhotoModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // PWA Installation Hook for PC & Mobile
  const { isInstalled: isPWAInstalled } = usePWAInstall();

  // Read Notice Tracker: track read post IDs in localStorage to calculate unread badge count
  const [readPostIds, setReadPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('maks_read_post_ids_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  // Calculate Unread Notice Count
  const unreadCount = posts.filter((p) => !readPostIds.includes(p.id)).length;

  // Sync Unread Count with Desktop/Mobile App Icon Badging & Favicon
  useEffect(() => {
    updateAppBadge(unreadCount);
  }, [unreadCount]);

  // Mark all current posts as read when user visits or browses the feed
  useEffect(() => {
    if (currentTab === 'feed' && posts.length > 0) {
      const allIds = posts.map((p) => p.id);
      const isDifferent = allIds.some((id) => !readPostIds.includes(id));
      if (isDifferent) {
        setReadPostIds(allIds);
        try {
          localStorage.setItem('maks_read_post_ids_v1', JSON.stringify(allIds));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [currentTab, posts, readPostIds]);

  // Automatically prompt for PWA installation upon visiting, unless user already installed or dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem('maks_pwa_prompt_dismissed') === 'true';
    const isInstalled = localStorage.getItem('maks_pwa_installed') === 'true';
    if (!isDismissed && !isInstalled && !isPWAInstalled) {
      const timer = setTimeout(() => {
        setIsInstallModalOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isPWAInstalled]);

  // Register PWA Service Worker for offline asset caching & icon badging
  useEffect(() => {
    registerPWAServiceWorker();
  }, []);

  // Track latest state for fallback offline / bulk sync
  const membersRef = useRef(members);
  const postsRef = useRef(posts);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // 1. REAL-TIME FIRESTORE SUBSCRIPTION: Cross-device Mobile & PC synchronization
  useEffect(() => {
    setIsSyncing(true);

    // Subscribe to Firestore members in real-time
    const unsubscribeMembers = subscribeToMembers(
      (updatedMembers) => {
        setMembers(updatedMembers);
        setCloudConnected(true);
        setIsSyncing(false);
        setIsInitialLoading(false);

        // Keep current logged-in user in sync with updated data if changed
        if (currentUser) {
          const freshMe = updatedMembers.find((m) => m.id === currentUser.id);
          if (freshMe) {
            setCurrentUser(freshMe);
            try {
              localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(freshMe));
            } catch (e) {
              console.error(e);
            }
          }
        }
      },
      (err) => {
        console.error('Firestore members listener error, fallback to local', err);
        setCloudConnected(false);
        setIsSyncing(false);
      }
    );

    // Subscribe to Firestore posts in real-time
    const unsubscribePosts = subscribeToPosts(
      (updatedPosts) => {
        // updatedPosts is the authoritative real-time state from Firestore
        setPosts(() => {
          try {
            localStorage.setItem(STORAGE_KEY_POSTS_CACHE, JSON.stringify(updatedPosts));
          } catch (e) {
            // ignore
          }
          return updatedPosts;
        });
        setIsSyncing(false);
      },
      (err) => {
        console.error('Firestore posts listener error', err);
        setIsSyncing(false);
      }
    );

    return () => {
      unsubscribeMembers();
      unsubscribePosts();
    };
  }, [currentUser?.id]);

  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || members[0] || INITIAL_MEMBERS[0];

  // Actions
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (currentTab !== 'trophies') {
      setCurrentTab('trophies');
    }
  };

  // Add Member: Save directly to Firestore (Instantly appears on Mobile & PC)
  const handleAddMember = async (newMember: SquashMember) => {
    try {
      setIsSyncing(true);
      await saveMemberToFirestore(newMember);
      setSelectedMemberId(newMember.id);
    } catch (err) {
      console.error('Failed to add member to cloud DB', err);
      // Fallback local update
      setMembers((prev) => [newMember, ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Member: Delete directly from Firestore (Instantly vanishes on Mobile & PC)
  const handleDeleteMember = async (memberId: string) => {
    try {
      setIsSyncing(true);
      await deleteMemberFromFirestore(memberId);
      if (selectedMemberId === memberId) {
        const remaining = members.filter((m) => m.id !== memberId);
        if (remaining.length > 0) setSelectedMemberId(remaining[0].id);
      }
    } catch (err) {
      console.error('Failed to delete member from cloud DB', err);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (member: SquashMember) => {
    setCurrentUser(member);
    setSelectedMemberId(member.id);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(member));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterFromGate = async (newMember: SquashMember) => {
    try {
      setIsSyncing(true);
      await saveMemberToFirestore(newMember);
      setCurrentUser(newMember);
      setSelectedMemberId(newMember.id);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newMember));
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Failed to register member', err);
      setMembers((prev) => [newMember, ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMember = async (updatedMember: SquashMember) => {
    try {
      setIsSyncing(true);
      await saveMemberToFirestore(updatedMember);
      if (currentUser && currentUser.id === updatedMember.id) {
        setCurrentUser(updatedMember);
        try {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedMember));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error('Failed to update member in cloud', err);
      setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddPost = async (
    postData: Omit<FeedPost, 'id' | 'niceShots' | 'isNiceShotGiven' | 'isBookmarked' | 'comments' | 'commentsCount'>,
    sendPush: boolean = true
  ) => {
    const newPost: FeedPost = {
      ...postData,
      id: `p-${Date.now()}`,
      niceShots: 0,
      isNiceShotGiven: false,
      isBookmarked: false,
      commentsCount: 0,
      comments: [],
    };

    // 1. Optimistically add to state and local cache immediately
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === newPost.id);
      if (exists) return prev;
      const updated = [newPost, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_POSTS_CACHE, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    try {
      setIsSyncing(true);
      await savePostToFirestore(newPost);
    } catch (err) {
      console.error('Failed to save post to cloud', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdatePost = async (updated: FeedPost) => {
    try {
      setIsSyncing(true);
      await savePostToFirestore(updated);
      setEditingPost(null);
    } catch (err) {
      console.error('Failed to update post', err);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    // 1. Optimistic instant removal from UI and cache
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postId);
      try {
        localStorage.setItem(STORAGE_KEY_POSTS_CACHE, JSON.stringify(filtered));
      } catch (e) {
        // ignore
      }
      return filtered;
    });
    try {
      setIsSyncing(true);
      await deletePostFromFirestore(postId);
    } catch (err) {
      console.error('Failed to delete post from cloud', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleNiceShot = async (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const isGiven = !target.isNiceShotGiven;
    const updated: FeedPost = {
      ...target,
      isNiceShotGiven: isGiven,
      niceShots: isGiven ? target.niceShots + 1 : Math.max(0, target.niceShots - 1),
    };
    try {
      await savePostToFirestore(updated);
    } catch (err) {
      console.error('Failed to toggle nice shot', err);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    }
  };

  const handleToggleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isBookmarked: !post.isBookmarked,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = async (postId: string, text: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const author = currentUser || selectedMember;
    const newComment = {
      id: `c-${Date.now()}`,
      author: author.name,
      avatar: author.avatar,
      text,
      timeAgo: '방금 전',
    };
    const updated: FeedPost = {
      ...target,
      commentsCount: target.commentsCount + 1,
      comments: [...target.comments, newComment],
    };
    try {
      await savePostToFirestore(updated);
    } catch (err) {
      console.error('Failed to add comment', err);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    }
  };

  const handleAddCheer = async (targetMemberId: string, authorName: string, text: string) => {
    const target = members.find((m) => m.id === targetMemberId);
    if (!target) return;
    const newCheer = {
      id: `cheer-${Date.now()}`,
      author: authorName,
      text,
      timestamp: '방금 전',
    };
    const updated: SquashMember = {
      ...target,
      cheers: [newCheer, ...target.cheers],
    };
    try {
      await saveMemberToFirestore(updated);
    } catch (err) {
      console.error('Failed to add cheer', err);
      setMembers((prev) => prev.map((m) => (m.id === targetMemberId ? updated : m)));
    }
  };

  const handleAddHonor = async (memberId: string, honorData: Omit<HonorItem, 'id'>) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const newHonor: HonorItem = {
      ...honorData,
      id: `h-${Date.now()}`,
    };
    const updated: SquashMember = {
      ...target,
      trophiesCount: target.trophiesCount + 1,
      honors: [newHonor, ...target.honors],
    };
    try {
      await saveMemberToFirestore(updated);
    } catch (err) {
      console.error('Failed to add honor', err);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
  };

  const handleAddPhoto = async (memberId: string, photoData: Omit<MemberPhoto, 'id'>) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const newPhoto: MemberPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
    };
    const updated: SquashMember = {
      ...target,
      photos: [newPhoto, ...target.photos],
    };
    try {
      await saveMemberToFirestore(updated);
    } catch (err) {
      console.error('Failed to add photo', err);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
  };

  const handleDownloadJson = () => {
    const exportData = {
      club_name: 'MAKS Squash Club',
      total_active_members: members.length,
      max_capacity: maxCapacity,
      last_synced_at: new Date().toISOString(),
      members,
      posts,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `maks_squash_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.members && Array.isArray(parsed.members)) {
        setIsSyncing(true);
        const importedMembers: SquashMember[] = parsed.members;
        const importedPosts: FeedPost[] = Array.isArray(parsed.posts) ? parsed.posts : posts;
        await syncAllToFirestore(importedMembers, importedPosts);
        setIsSyncing(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Invalid JSON file', err);
      setIsSyncing(false);
      return false;
    }
  };

  const handleForceCloudSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllToFirestore(membersRef.current, postsRef.current);
    } catch (e) {
      console.error('Cloud sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0c0e15] text-gray-100 overflow-hidden font-sans select-none">
      {/* 1. Left Member Sidebar */}
      <MemberSidebar
        members={members}
        maxCapacity={maxCapacity}
        selectedMemberId={selectedMemberId}
        isLoading={isInitialLoading}
        onSelectMember={handleSelectMember}
        onAddMemberClick={() => setCurrentTab('register')}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#11131a] relative">
        {/* Top Header */}
        <Header
          selectedMember={selectedMember}
          currentUser={currentUser}
          currentTab={currentTab}
          onLogout={handleLogout}
          onOpenGate={() => {}}
          onSyncNow={handleForceCloudSync}
          isSyncing={isSyncing}
          cloudConnected={cloudConnected}
          unreadCount={unreadCount}
          onNavigateToRegister={() => setCurrentTab('register')}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Tab Views */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'feed' && (
            <FeedView
              posts={posts}
              members={members}
              isPWAInstalled={isPWAInstalled}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onToggleNiceShot={handleToggleNiceShot}
              onToggleBookmark={handleToggleBookmark}
              onOpenComments={(post) => setActiveCommentPost(post)}
              onEditPost={(post) => setEditingPost(post)}
              onDeletePost={handleDeletePost}
              onViewMemberProfile={handleSelectMember}
              onOpenImageModal={(imageUrl, title) =>
                setLightboxData({ isOpen: true, imageUrl, title })
              }
            />
          )}

          {currentTab === 'members' && (
            <MembersView
              members={members}
              maxCapacity={maxCapacity}
              currentUser={currentUser}
              onSelectMemberForTrophy={handleSelectMember}
              onSelectMemberForFeed={() => setCurrentTab('feed')}
              onOpenRegister={() => setCurrentTab('register')}
              onOpenEditProfile={(member) => {
                setSelectedMemberId(member.id);
                setIsEditProfileOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {currentTab === 'trophies' && (
            <TrophyRoomView
              member={selectedMember}
              allMembers={members}
              currentUser={currentUser}
              onSelectMember={setSelectedMemberId}
              onOpenCheerModal={() => setIsCheerModalOpen(true)}
              onOpenAddPhotoModal={() => setIsAddHonorPhotoModalOpen(true)}
              onOpenImageModal={(imageUrl, title) =>
                setLightboxData({ isOpen: true, imageUrl, title })
              }
              onOpenEditProfile={(member) => {
                setSelectedMemberId(member.id);
                setIsEditProfileOpen(true);
              }}
            />
          )}

          {currentTab === 'register' && (
            <RegisterView
              members={members}
              maxCapacity={maxCapacity}
              onAddMember={handleAddMember}
              onSelectMember={handleSelectMember}
            />
          )}

          {currentTab === 'backup' && (
            <BackupView
              members={members}
              maxCapacity={maxCapacity}
              onDownloadJson={handleDownloadJson}
              onImportJson={handleImportJson}
              onSyncServer={handleForceCloudSync}
              isSyncing={isSyncing}
            />
          )}
        </div>

        {/* Bottom Floating Navigation */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          currentUser={currentUser}
          unreadCount={unreadCount}
        />
      </main>

      {/* 3. Global Modals */}
      {isCreatePostOpen && (
        <CreatePostModal
          isOpen={isCreatePostOpen}
          members={members}
          currentUser={currentUser}
          onClose={() => setIsCreatePostOpen(false)}
          onAddPost={handleAddPost}
        />
      )}

      {editingPost && (
        <EditPostModal
          isOpen={true}
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />
      )}

      {activeCommentPost && (
        <CommentsDrawer
          isOpen={true}
          post={activeCommentPost}
          currentUser={currentUser || selectedMember}
          onClose={() => setActiveCommentPost(null)}
          onAddComment={(postId, commentText, author) => handleAddComment(postId, commentText)}
        />
      )}

      {isCheerModalOpen && (
        <AddCheerModal
          isOpen={isCheerModalOpen}
          targetMember={selectedMember}
          allMembers={members}
          onClose={() => setIsCheerModalOpen(false)}
          onAddCheer={(targetMemberId, authorName, text) => handleAddCheer(targetMemberId, authorName, text)}
        />
      )}

      {isAddHonorPhotoModalOpen && (
        <AddHonorOrPhotoModal
          isOpen={isAddHonorPhotoModalOpen}
          member={selectedMember}
          onClose={() => setIsAddHonorPhotoModalOpen(false)}
          onAddHonor={(memberId, honorData) => handleAddHonor(memberId, honorData)}
          onAddPhoto={(memberId, photoData) => handleAddPhoto(memberId, photoData)}
        />
      )}

      {lightboxData.isOpen && (
        <LightboxModal
          isOpen={lightboxData.isOpen}
          imageUrl={lightboxData.imageUrl}
          title={lightboxData.title}
          onClose={() => setLightboxData({ isOpen: false, imageUrl: '', title: '' })}
        />
      )}

      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          currentUser={selectedMember}
          onClose={() => setIsEditProfileOpen(false)}
          onUpdateMember={handleUpdateMember}
        />
      )}

      {/* PC & Mobile Desktop Shortcut PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Auth Gate (Login/Register) */}
      {!currentUser && (
        <AuthGateModal
          isOpen={true}
          members={members}
          onLogin={handleLogin}
          onRegister={handleRegisterFromGate}
        />
      )}
    </div>
  );
}
