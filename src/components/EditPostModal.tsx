import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, MapPin, Clock, Calendar, Save, Trash2 } from 'lucide-react';
import { FeedPost } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: FeedPost | null;
  onUpdatePost: (updatedPost: FeedPost) => void;
  onDeletePost: (postId: string) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onUpdatePost,
  onDeletePost,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [matchDuration, setMatchDuration] = useState('');
  const [setScore, setSetScore] = useState('');
  const [badgeTag, setBadgeTag] = useState('');
  const [badgeType, setBadgeType] = useState<'pro' | 'kit' | 'trophy' | 'regular'>('pro');
  const [category, setCategory] = useState<'all' | 'match' | 'awards'>('match');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (post) {
      setCaption(post.caption || '');
      setImageUrl(post.imageUrl || '');
      setLocation(post.location || '');
      setMatchDuration(post.matchDuration || '');
      setSetScore(post.setScore || '');
      setBadgeTag(post.badgeTag || '');
      setBadgeType(post.badgeType || 'regular');
      setCategory(post.category || 'match');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      alert('게시글 내용을 입력해 주세요.');
      return;
    }

    onUpdatePost({
      ...post,
      caption,
      imageUrl,
      location,
      matchDuration: matchDuration || undefined,
      setScore: setScore || undefined,
      badgeTag: badgeTag || undefined,
      badgeType,
      category,
    });

    onClose();
  };

  const handleOpenDelete = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    onDeletePost(post.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#161822] border border-white/[0.12] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-[#11131a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#f5c200]">✏️</span>
            <h2 className="font-chivo font-black text-base text-white">
              게시물 수정
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* Post Author Preview */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#11131a] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-chivo font-bold text-xs text-white block">
                  {post.authorName}
                </span>
                <span className="text-[10px] text-gray-400 font-chivo">
                  {post.timeAgo} 작성됨
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenDelete}
              className="px-2.5 py-1.5 rounded-md bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 font-chivo font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>삭제하기</span>
            </button>
          </div>

          {/* Photo Preview & Edit */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              게시물 사진
            </label>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0c0e15] border border-white/10 mb-2">
              <img
                src={imageUrl}
                alt="미리보기"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {badgeTag && (
                <div className="absolute bottom-3 left-3 bg-[#11131a]/90 backdrop-blur-md border border-[#f5c200]/40 px-2.5 py-1 rounded text-[10px] font-chivo font-black text-[#f5c200] tracking-wider uppercase">
                  {badgeTag}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded bg-[#1e222d] hover:bg-[#282a31] border border-white/10 text-xs font-chivo font-bold text-white flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>사진 변경</span>
              </button>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              게시글 내용 <span className="text-[#f5c200]">*</span>
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200] leading-relaxed"
              required
            />
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              >
                <option value="match">#오늘의게임 🔥</option>
                <option value="awards">#대회수상 🏆</option>
                <option value="all">#클럽일상 ⚡</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                뱃지 태그
              </label>
              <select
                value={badgeTag}
                onChange={(e) => {
                  setBadgeTag(e.target.value);
                  if (e.target.value === 'PRO MATCH') setBadgeType('pro');
                  else if (e.target.value === 'OFFICIAL KIT 2024') setBadgeType('kit');
                  else setBadgeType('regular');
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              >
                <option value="">없음</option>
                <option value="PRO MATCH">●● PRO MATCH</option>
                <option value="OFFICIAL KIT 2024">OFFICIAL KIT 2024</option>
                <option value="CHAMPIONSHIP">CHAMPIONSHIP 🏆</option>
                <option value="MORNING DRILL">MORNING DRILL ⚡</option>
              </select>
            </div>
          </div>

          {/* Match Telemetry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-[#f5c200]" />
                <span>경기 시간</span>
              </label>
              <input
                type="text"
                value={matchDuration}
                onChange={(e) => setMatchDuration(e.target.value)}
                placeholder="예: 총 118분 혈투"
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-amber-400" />
                <span>세트 스코어</span>
              </label>
              <input
                type="text"
                value={setScore}
                onChange={(e) => setSetScore(e.target.value)}
                placeholder="예: 세트 스코어 3:1"
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
              <MapPin size={12} className="text-[#f5c200]" />
              <span>장소</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Save size={16} />
              <span>수정 사항 저장</span>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="게시물 삭제"
        description="정말로 이 게시물을 삭제하시겠습니까? 삭제된 게시물은 복구할 수 없습니다."
      />
    </div>
  );
};
