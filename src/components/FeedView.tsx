import React, { useState, useRef, useEffect } from 'react';
import { Camera, MoreVertical, MessageSquare, Bookmark, Flame, Trophy, Clock, Calendar, Check, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { FeedPost, SquashMember } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface FeedViewProps {
  posts: FeedPost[];
  members: SquashMember[];
  isPWAInstalled?: boolean;
  onOpenInstallModal?: () => void;
  onOpenCreatePost: () => void;
  onToggleNiceShot: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onOpenComments: (post: FeedPost) => void;
  onViewMemberProfile: (memberId: string) => void;
  onOpenImageModal: (imageUrl: string, title: string) => void;
  onEditPost: (post: FeedPost) => void;
  onDeletePost: (postId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  members,
  isPWAInstalled,
  onOpenInstallModal,
  onOpenCreatePost,
  onToggleNiceShot,
  onToggleBookmark,
  onOpenComments,
  onViewMemberProfile,
  onOpenImageModal,
  onEditPost,
  onDeletePost,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'match' | 'awards'>('all');
  const [swingingPostId, setSwingingPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<FeedPost | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'all') return true;
    return post.category === activeFilter;
  });

  const handleNiceShotClick = (postId: string) => {
    setSwingingPostId(postId);
    onToggleNiceShot(postId);
    setTimeout(() => {
      setSwingingPostId(null);
    }, 500);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3.5 pb-24">
      {/* Top CTA: 공지 작성 & 사진 업로드 */}
      <button
        type="button"
        onClick={onOpenCreatePost}
        className="w-full py-3 px-4 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,194,0,0.3)] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Camera size={20} strokeWidth={2.5} />
        <span>공지 작성 / 사진 업로드</span>
      </button>

      {/* MAKS Desktop / Mobile Shortcut App Banner */}
      {!isPWAInstalled && onOpenInstallModal && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#1c202d] via-[#161822] to-[#12141c] border border-[#f5c200]/35 flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow ring-1 ring-[#f5c200]/40 p-0.5 bg-[#0f1118] shrink-0">
              <img
                src="/pwa-192x192.png"
                alt="MAKS Icon"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>바탕화면에 MAKS 단축아이콘 생성</span>
                <span className="px-1.5 py-0.2 rounded bg-[#f5c200]/20 text-[#f5c200] text-[9px] font-bold shrink-0">무설치</span>
              </div>
              <div className="text-[11px] text-gray-300 truncate">
                PC & 스마트폰 바탕화면 바로가기 + 새 공지 숫자 뱃지 지원
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="px-3.5 py-2 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs shrink-0 cursor-pointer shadow active:scale-95 transition-all"
          >
            아이콘 추가
          </button>
        </div>
      )}

      {/* Filter Category Pills: 전체 공지, 대회수상, 게임/매치 */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-chivo font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#f5c200] text-[#0f1118] shadow-sm'
              : 'bg-[#1a1c24] text-gray-300 border border-white/[0.08] hover:border-white/20'
          }`}
        >
          #전체 공지
        </button>
        <button
          onClick={() => setActiveFilter('awards')}
          className={`px-3 py-1.5 rounded-full text-xs font-chivo font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeFilter === 'awards'
              ? 'bg-[#f5c200] text-[#0f1118] shadow-sm'
              : 'bg-[#1a1c24] text-gray-300 border border-white/[0.08] hover:border-white/20'
          }`}
        >
          <span>🏆</span>
          <span>#대회수상</span>
        </button>
        <button
          onClick={() => setActiveFilter('match')}
          className={`px-3 py-1.5 rounded-full text-xs font-chivo font-bold flex items-center gap-1 transition-all cursor-pointer ${
            activeFilter === 'match'
              ? 'bg-[#f5c200] text-[#0f1118] shadow-sm'
              : 'bg-[#1a1c24] text-gray-300 border border-white/[0.08] hover:border-white/20'
          }`}
        >
          <span>🔥</span>
          <span>#오늘의게임</span>
        </button>
      </div>

      {/* Feed Cards or Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl bg-[#161822] border border-white/[0.08] p-8 text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#f5c200]/10 border border-[#f5c200]/30 flex items-center justify-center text-[#f5c200]">
            <Camera size={24} />
          </div>
          <div>
            <h3 className="font-chivo font-black text-white text-sm sm:text-base">
              등록된 공지/게시글이 없습니다
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              상단의 [공지 작성 / 사진 업로드] 버튼을 눌러 첫 번째 소식을 공유해 보세요!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isSwinging = swingingPostId === post.id;
            const isMenuOpen = activeMenuPostId === post.id;

          return (
            <article
              key={post.id}
              className="rounded-xl bg-[#161822] border border-white/[0.08] overflow-hidden shadow-lg transition-all"
            >
              {/* Post Header */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between">
                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => onViewMemberProfile(post.authorId)}
                >
                  <div className="relative">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-white/20 group-hover:border-[#f5c200] transition-colors"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    {post.isCaptain && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border border-[#161822]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-chivo font-extrabold text-white text-sm group-hover:text-[#f5c200] transition-colors">
                        {post.authorName}
                      </span>
                      {post.authorBadge && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[#f5c200] text-[10px] font-chivo font-black tracking-wide">
                          {post.authorBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                      <span>{post.timeAgo}</span>
                      {post.location && post.category === 'match' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-gray-300">
                            <span>📍</span>
                            <span>{post.location}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right menu */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuPostId(isMenuOpen ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-20 w-36 rounded-xl bg-[#1e222d] border border-white/10 shadow-2xl py-1 text-xs text-gray-200"
                    >
                      <button
                        onClick={() => {
                          setActiveMenuPostId(null);
                          onEditPost(post);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-white/[0.08] flex items-center gap-2 text-gray-200"
                      >
                        <Edit2 size={13} />
                        <span>게시글 수정</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuPostId(null);
                          setPostToDelete(post);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-red-500/20 flex items-center gap-2 text-red-400"
                      >
                        <Trash2 size={13} />
                        <span>게시글 삭제</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Image */}
              <div
                className="relative aspect-video sm:aspect-[16/10] bg-[#0c0e15] overflow-hidden cursor-pointer"
                onClick={() => onOpenImageModal(post.imageUrl, post.caption)}
              >
                <img
                  src={post.imageUrl}
                  alt="Post visual"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80';
                  }}
                />

                {/* Overlay Badge Tag */}
                {post.badgeTag && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-[#f5c200] font-chivo font-black text-[11px] tracking-wider uppercase shadow-md flex items-center gap-1">
                      <span>⚡</span>
                      <span>{post.badgeTag}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Award or Match Stats Banner (if present) */}
              {post.category === 'awards' && post.awardsDetail && (
                <div className="px-3.5 py-2.5 bg-[#f5c200]/10 border-y border-[#f5c200]/25 flex items-center gap-2 text-xs font-chivo">
                  <span className="p-1 rounded bg-[#f5c200]/20 text-[#f5c200]">
                    <Trophy size={14} />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#f5c200] font-black uppercase tracking-wider">대회 수상 내역</span>
                    <span className="text-white font-extrabold text-xs">{post.awardsDetail}</span>
                  </div>
                </div>
              )}

              {post.category === 'match' && (post.matchDuration || post.setScore) && (
                <div className="px-3.5 py-2 bg-[#12141c] border-y border-white/[0.04] flex items-center gap-3 text-xs text-gray-300 font-chivo">
                  {post.matchDuration && (
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock size={12} className="text-[#f5c200]" />
                      <span>{post.matchDuration}</span>
                    </span>
                  )}
                  {post.matchDuration && post.setScore && (
                    <span className="text-white/20">•</span>
                  )}
                  {post.setScore && (
                    <span className="flex items-center gap-1 font-black text-white">
                      <span>🎾</span>
                      <span>{post.setScore}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Nice Shot Swing Button */}
                    <button
                      onClick={() => handleNiceShotClick(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-chivo font-black transition-all ${
                        post.isNiceShotGiven
                          ? 'bg-[#f5c200] text-[#0f1118] shadow-sm'
                          : 'bg-[#1e222d] text-gray-300 hover:text-white hover:bg-[#282d3c]'
                      }`}
                    >
                      <span className={`inline-block ${isSwinging ? 'animate-bounce text-base' : ''}`}>
                        🏸
                      </span>
                      <span>나이스샷</span>
                      <span className="ml-0.5">{post.niceShots}</span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={() => onOpenComments(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e222d] text-gray-300 hover:text-white hover:bg-[#282d3c] text-xs font-chivo font-semibold transition-colors"
                    >
                      <MessageSquare size={14} />
                      <span>댓글 {post.commentsCount}</span>
                    </button>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => onToggleBookmark(post.id)}
                    className={`p-2 rounded-full transition-colors ${
                      post.isBookmarked
                        ? 'text-[#f5c200] bg-[#f5c200]/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Bookmark size={17} fill={post.isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Caption Text */}
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                  <span
                    className="font-chivo font-extrabold text-white mr-1.5 cursor-pointer hover:underline"
                    onClick={() => onViewMemberProfile(post.authorId)}
                  >
                    {post.authorName}
                  </span>
                  {post.caption}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    )}

      {/* Delete Confirm Modal */}
      {postToDelete && (
        <DeleteConfirmModal
          isOpen={!!postToDelete}
          title="게시글 삭제"
          description={`'${postToDelete.authorName}' 님의 이 게시글을 정말로 삭제하시겠습니까?`}
          onConfirm={() => {
            onDeletePost(postToDelete.id);
            setPostToDelete(null);
          }}
          onClose={() => setPostToDelete(null)}
        />
      )}
    </div>
  );
};
