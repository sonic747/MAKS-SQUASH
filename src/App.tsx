import React, { useState, useEffect, useCallback, useRef } from 'react';
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

import { INITIAL_MEMBERS, INITIAL_POSTS } from './data/initialData';
import { TabType, SquashMember, FeedPost, HonorItem, MemberPhoto } from './types';

const STORAGE_KEY_MEMBERS = 'maks_squash_members_v4';
const STORAGE_KEY_POSTS = 'maks_squash_posts_v4';
const STORAGE_KEY_AUTH = 'maks_squash_current_user_v4';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Members State
  const [members, setMembers] = useState<SquashMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (saved) {
        let parsed: SquashMember[] = JSON.parse(saved);
        parsed = parsed.filter(
          (m) => !m.name.includes('카카오') && !m.username.startsWith('kakao_')
        );
        const adminExists = parsed.some((m) => m.username === 'admin');
        if (!adminExists) {
          const adminUser = INITIAL_MEMBERS.find((m) => m.username === 'admin');
          if (adminUser) {
            return [adminUser, ...parsed];
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load members from localStorage', e);
    }
    return INITIAL_MEMBERS;
  });

  // Current Logged-in User (Gate state)
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

  // Posts State
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POSTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load posts from localStorage', e);
    }
    return INITIAL_POSTS;
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

  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  // Ref to track latest state for syncing without stale closures
  const membersRef = useRef(members);
  const postsRef = useRef(posts);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Sync to server API
  const pushToServer = useCallback(async (currentMembers: SquashMember[], currentPosts: FeedPost[]) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          members: currentMembers,
          posts: currentPosts,
        }),
      });
    } catch (err) {
      console.error('Failed to push data to server', err);
    }
  }, []);

  // Fetch latest shared data from server (called on load, tab change, focus, and timer)
  const fetchFromServer = useCallback(async (showLoading = false) => {
    if (showLoading) setIsSyncing(true);
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.members && Array.isArray(data.members) && data.members.length > 0) {
          // If server has members, update local state
          setMembers(data.members);
          try {
            localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(data.members));
          } catch (e) {
            console.error(e);
          }
        } else {
          // First time or server empty: push our initial data to server
          await pushToServer(membersRef.current, postsRef.current);
        }

        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          setPosts(data.posts);
          try {
            localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(data.posts));
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch from server', err);
    } finally {
      if (showLoading) setIsSyncing(false);
    }
  }, [pushToServer]);

  // 1. Initial Load & Window Focus Sync (so when mobile or PC switches back to the tab, it syncs immediately)
  useEffect(() => {
    fetchFromServer(true);

    const handleFocus = () => {
      fetchFromServer(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetchFromServer(false);
      }
    });

    // Background polling every 15 seconds to ensure mobile and browser are in lockstep
    const interval = setInterval(() => {
      fetchFromServer(false);
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchFromServer]);

  // Save to LocalStorage whenever members/posts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save members', e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save posts', e);
    }
  }, [posts]);

  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || members[0] || INITIAL_MEMBERS[0];

  // Actions
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (currentTab !== 'trophies') {
      setCurrentTab('trophies');
    }
  };

  const handleAddMember = (newMember: SquashMember) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    setSelectedMemberId(newMember.id);
    pushToServer(updated, posts);
  };

  const handleDeleteMember = (memberId: string) => {
    const remaining = members.filter((m) => m.id !== memberId);
    setMembers(remaining);
    if (selectedMemberId === memberId && remaining.length > 0) {
      setSelectedMemberId(remaining[0].id);
    }
    pushToServer(remaining, posts);
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

  const handleRegisterFromGate = (newMember: SquashMember) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    setCurrentUser(newMember);
    setSelectedMemberId(newMember.id);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newMember));
    } catch (e) {
      console.error(e);
    }
    pushToServer(updated, posts);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMember = (updatedMember: SquashMember) => {
    const updatedList = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updatedList);
    if (currentUser && currentUser.id === updatedMember.id) {
      setCurrentUser(updatedMember);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedMember));
      } catch (e) {
        console.error(e);
      }
    }
    // Also update author info across their posts if updated
    const updatedPosts = posts.map((p) =>
      p.authorId === updatedMember.id
        ? {
            ...p,
            authorName: updatedMember.name,
            authorAvatar: updatedMember.avatar,
            authorBadge: updatedMember.role === 'captain' ? 'CAPTAIN' : updatedMember.roleLabel,
          }
        : p
    );
    setPosts(updatedPosts);
    pushToServer(updatedList, updatedPosts);
  };

  const handleAddPost = (
    postData: Omit<FeedPost, 'id' | 'niceShots' | 'isNiceShotGiven' | 'isBookmarked' | 'comments' | 'commentsCount'>
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

    const updated = [newPost, ...posts];
    setPosts(updated);
    pushToServer(members, updated);
  };

  const handleUpdatePost = (updated: FeedPost) => {
    const updatedPosts = posts.map((p) => (p.id === updated.id ? updated : p));
    setPosts(updatedPosts);
    setEditingPost(null);
    pushToServer(members, updatedPosts);
  };

  const handleDeletePost = (postId: string) => {
    const updatedPosts = posts.filter((p) => p.id !== postId);
    setPosts(updatedPosts);
    pushToServer(members, updatedPosts);
  };

  const handleToggleNiceShot = (postId: string) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const isGiven = !post.isNiceShotGiven;
        return {
          ...post,
          isNiceShotGiven: isGiven,
          niceShots: isGiven ? post.niceShots + 1 : Math.max(0, post.niceShots - 1),
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    pushToServer(members, updatedPosts);
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

  const handleAddComment = (postId: string, text: string) => {
    const author = currentUser || selectedMember;
    const newComment = {
      id: `c-${Date.now()}`,
      author: author.name,
      avatar: author.avatar,
      text,
      timeAgo: '방금 전',
    };

    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          commentsCount: post.commentsCount + 1,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    pushToServer(members, updatedPosts);
  };

  const handleAddCheer = (targetMemberId: string, authorName: string, text: string) => {
    const newCheer = {
      id: `cheer-${Date.now()}`,
      author: authorName,
      text,
      timestamp: '방금 전',
    };

    const updatedMembers = members.map((m) => {
      if (m.id === targetMemberId) {
        return {
          ...m,
          cheers: [newCheer, ...m.cheers],
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    pushToServer(updatedMembers, posts);
  };

  const handleAddHonor = (memberId: string, honorData: Omit<HonorItem, 'id'>) => {
    const newHonor: HonorItem = {
      ...honorData,
      id: `h-${Date.now()}`,
    };

    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          trophiesCount: m.trophiesCount + 1,
          honors: [newHonor, ...m.honors],
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    pushToServer(updatedMembers, posts);
  };

  const handleAddPhoto = (memberId: string, photoData: Omit<MemberPhoto, 'id'>) => {
    const newPhoto: MemberPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
    };

    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          photos: [newPhoto, ...m.photos],
        };
      }
      return m;
    });
    setMembers(updatedMembers);
    pushToServer(updatedMembers, posts);
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maks_members.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.members && Array.isArray(parsed.members)) {
        setMembers(parsed.members);
        let updatedPosts = posts;
        if (parsed.posts && Array.isArray(parsed.posts)) {
          setPosts(parsed.posts);
          updatedPosts = parsed.posts;
        }
        pushToServer(parsed.members, updatedPosts);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON file', e);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0c0e15] text-[#e2e2ec] flex justify-center selection:bg-[#f5c200] selection:text-[#0f1118]">
      {/* App Shell Container */}
      <div className="w-full max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-4xl min-h-screen bg-[#0f1118] flex flex-col border-x border-white/[0.08] shadow-2xl relative">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          currentUser={currentUser}
          isSyncing={isSyncing}
          onLogout={handleLogout}
          onManualSync={() => fetchFromServer(true)}
        />

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Member Left Rail */}
          <MemberSidebar
            members={members}
            maxCapacity={maxCapacity}
            selectedMemberId={selectedMemberId}
            onSelectMember={handleSelectMember}
            onAddMemberClick={() => setCurrentTab('register')}
          />

          {/* Center Screen Views */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0e15]">
            {currentTab === 'feed' && (
              <FeedView
                posts={posts}
                members={members}
                onOpenCreatePost={() => setIsCreatePostOpen(true)}
                onToggleNiceShot={handleToggleNiceShot}
                onToggleBookmark={handleToggleBookmark}
                onOpenComments={(post) => setActiveCommentPost(post)}
                onEditPost={(post) => setEditingPost(post)}
                onDeletePost={handleDeletePost}
                onViewMemberProfile={(authorId) => handleSelectMember(authorId)}
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
                onSelectMemberForTrophy={(mId) => handleSelectMember(mId)}
                onSelectMemberForFeed={(mId) => {
                  handleSelectMember(mId);
                  setCurrentTab('feed');
                }}
                onOpenRegister={() => setCurrentTab('register')}
                onOpenEditProfile={(m) => {
                  setSelectedMemberId(m.id);
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
                onSelectMember={(mId) => setSelectedMemberId(mId)}
                onOpenAddPhotoModal={() => setIsAddHonorPhotoModalOpen(true)}
                onOpenCheerModal={() => setIsCheerModalOpen(true)}
                onOpenImageModal={(imageUrl, title) =>
                  setLightboxData({ isOpen: true, imageUrl, title })
                }
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
              />
            )}

            {currentTab === 'register' && (
              <RegisterView
                members={members}
                maxCapacity={maxCapacity}
                onAddMember={handleAddMember}
                onSelectMember={(mId) => {
                  setSelectedMemberId(mId);
                  setCurrentTab('trophies');
                }}
              />
            )}

            {currentTab === 'backup' && (
              <BackupView
                members={members}
                maxCapacity={maxCapacity}
                onDownloadJson={handleDownloadJson}
                onImportJson={handleImportJson}
                onSyncServer={() => fetchFromServer(true)}
                isSyncing={isSyncing}
              />
            )}
          </main>
        </div>

        {/* Bottom Navigation */}
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          currentUser={currentUser}
        />

        {/* Global Modals */}
        <AuthGateModal
          isOpen={!currentUser}
          members={members}
          onLogin={handleLogin}
          onRegister={handleRegisterFromGate}
        />

        <CreatePostModal
          isOpen={isCreatePostOpen}
          members={members}
          currentUser={currentUser}
          onClose={() => setIsCreatePostOpen(false)}
          onAddPost={handleAddPost}
        />

        <EditPostModal
          isOpen={Boolean(editingPost)}
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />

        <CommentsDrawer
          isOpen={Boolean(activeCommentPost)}
          post={activeCommentPost}
          currentUser={currentUser || selectedMember}
          onClose={() => setActiveCommentPost(null)}
          onAddComment={(postId, commentText) => {
            handleAddComment(postId, commentText);
          }}
        />

        <AddCheerModal
          isOpen={isCheerModalOpen}
          targetMember={selectedMember}
          allMembers={members}
          onClose={() => setIsCheerModalOpen(false)}
          onAddCheer={(targetMemberId, author, text) => handleAddCheer(targetMemberId, author, text)}
        />

        <AddHonorOrPhotoModal
          isOpen={isAddHonorPhotoModalOpen}
          member={selectedMember}
          onClose={() => setIsAddHonorPhotoModalOpen(false)}
          onAddHonor={(memberId, honorData) => handleAddHonor(memberId, honorData)}
          onAddPhoto={(memberId, photoData) => handleAddPhoto(memberId, photoData)}
        />

        <EditProfileModal
          isOpen={isEditProfileOpen}
          currentUser={selectedMember}
          onClose={() => setIsEditProfileOpen(false)}
          onUpdateMember={handleUpdateMember}
        />

        <LightboxModal
          isOpen={lightboxData.isOpen}
          imageUrl={lightboxData.imageUrl}
          title={lightboxData.title}
          onClose={() =>
            setLightboxData({ isOpen: false, imageUrl: '', title: '' })
          }
        />
      </div>
    </div>
  );
}
