import React, { useState, useEffect } from 'react';
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

const STORAGE_KEY_MEMBERS = 'maks_squash_members_v3';
const STORAGE_KEY_POSTS = 'maks_squash_posts_v3';
const STORAGE_KEY_AUTH = 'maks_squash_current_user_v3';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');

  // Members State
  const [members, setMembers] = useState<SquashMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (saved) {
        let parsed: SquashMember[] = JSON.parse(saved);
        // Clean out any dummy/test "카카오 회원" per user request
        parsed = parsed.filter(
          (m) =>
            !m.name.includes('카카오') &&
            !m.username.startsWith('kakao_')
        );
        // Ensure admin user (username === 'admin') is always included
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

  // Sync persistence
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
    setMembers((prev) => [newMember, ...prev]);
    setSelectedMemberId(newMember.id);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (selectedMemberId === memberId) {
      const remaining = members.filter((m) => m.id !== memberId);
      if (remaining.length > 0) {
        setSelectedMemberId(remaining[0].id);
      }
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

  const handleRegisterFromGate = (newMember: SquashMember) => {
    setMembers((prev) => [newMember, ...prev]);
    setCurrentUser(newMember);
    setSelectedMemberId(newMember.id);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newMember));
    } catch (e) {
      console.error(e);
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

  const handleUpdateMember = (updated: SquashMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (currentUser && currentUser.id === updated.id) {
      setCurrentUser(updated);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    // Also update author info across their posts if updated
    setPosts((prev) =>
      prev.map((p) =>
        p.authorId === updated.id
          ? {
              ...p,
              authorName: updated.name,
              authorAvatar: updated.avatar,
              authorBadge: updated.role === 'captain' ? 'CAPTAIN' : updated.roleLabel,
            }
          : p
      )
    );
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

    setPosts((prev) => [newPost, ...prev]);
  };

  const handleUpdatePost = (updated: FeedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPost(null);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleToggleNiceShot = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isGiven = !post.isNiceShotGiven;
          return {
            ...post,
            isNiceShotGiven: isGiven,
            niceShots: isGiven ? post.niceShots + 1 : Math.max(0, post.niceShots - 1),
          };
        }
        return post;
      })
    );
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

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );
  };

  const handleAddCheer = (targetMemberId: string, authorName: string, text: string) => {
    const newCheer = {
      id: `cheer-${Date.now()}`,
      author: authorName,
      text,
      timestamp: '방금 전',
    };

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === targetMemberId) {
          return {
            ...m,
            cheers: [newCheer, ...m.cheers],
          };
        }
        return m;
      })
    );
  };

  const handleAddHonor = (memberId: string, honorData: Omit<HonorItem, 'id'>) => {
    const newHonor: HonorItem = {
      ...honorData,
      id: `h-${Date.now()}`,
    };

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            trophiesCount: m.trophiesCount + 1,
            honors: [newHonor, ...m.honors],
          };
        }
        return m;
      })
    );
  };

  const handleAddPhoto = (memberId: string, photoData: Omit<MemberPhoto, 'id'>) => {
    const newPhoto: MemberPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
    };

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            photos: [newPhoto, ...m.photos],
          };
        }
        return m;
      })
    );
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
        if (parsed.posts && Array.isArray(parsed.posts)) {
          setPosts(parsed.posts);
        }
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
          onLogout={handleLogout}
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
                onViewMemberProfile={(authorId) => {
                  setSelectedMemberId(authorId);
                  setCurrentTab('trophies');
                }}
                onOpenImageModal={(imageUrl, title) =>
                  setLightboxData({ isOpen: true, imageUrl, title })
                }
                onEditPost={(post) => setEditingPost(post)}
                onDeletePost={handleDeletePost}
              />
            )}

            {currentTab === 'trophies' && (
              <TrophyRoomView
                member={selectedMember}
                allMembers={members}
                currentUser={currentUser}
                onSelectMember={handleSelectMember}
                onOpenAddPhotoModal={() => setIsAddHonorPhotoModalOpen(true)}
                onOpenCheerModal={() => setIsCheerModalOpen(true)}
                onOpenImageModal={(imageUrl: string, title: string) =>
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
                onSelectMember={handleSelectMember}
              />
            )}

            {currentTab === 'backup' && (
              <BackupView
                members={members}
                maxCapacity={maxCapacity}
                onDownloadJson={handleDownloadJson}
                onImportJson={handleImportJson}
              />
            )}

            {currentTab === 'members' && (
              <MembersView
                members={members}
                maxCapacity={maxCapacity}
                currentUser={currentUser}
                onSelectMemberForTrophy={(id) => {
                  setSelectedMemberId(id);
                  setCurrentTab('trophies');
                }}
                onSelectMemberForFeed={(id) => {
                  setSelectedMemberId(id);
                  setCurrentTab('feed');
                }}
                onOpenRegister={() => setCurrentTab('register')}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                onDeleteMember={handleDeleteMember}
              />
            )}
          </main>
        </div>

        {/* Bottom Fixed Navigation Bar */}
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} currentUser={currentUser} />

        {/* Auth Gate Modal: Login/Register Required */}
        <AuthGateModal
          isOpen={!currentUser}
          members={members}
          onLogin={handleLogin}
          onRegister={handleRegisterFromGate}
        />

        {/* Modals */}
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          members={members}
          currentUser={currentUser}
          onAddPost={handleAddPost}
        />

        {/* Edit Profile Modal */}
        {currentUser && (
          <EditProfileModal
            isOpen={isEditProfileOpen}
            onClose={() => setIsEditProfileOpen(false)}
            currentUser={currentUser}
            onUpdateMember={handleUpdateMember}
          />
        )}

        <EditPostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />

        <CommentsDrawer
          isOpen={!!activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          post={activeCommentPost}
          currentUser={currentUser || selectedMember}
          onAddComment={handleAddComment}
        />

        <AddCheerModal
          isOpen={isCheerModalOpen}
          onClose={() => setIsCheerModalOpen(false)}
          targetMember={selectedMember}
          allMembers={members}
          onAddCheer={handleAddCheer}
        />

        <AddHonorOrPhotoModal
          isOpen={isAddHonorPhotoModalOpen}
          onClose={() => setIsAddHonorPhotoModalOpen(false)}
          member={selectedMember}
          onAddHonor={handleAddHonor}
          onAddPhoto={handleAddPhoto}
        />

        <LightboxModal
          isOpen={lightboxData.isOpen}
          onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
          imageUrl={lightboxData.imageUrl}
          title={lightboxData.title}
        />
      </div>
    </div>
  );
}
