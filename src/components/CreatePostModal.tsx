import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, MapPin, Clock, Calendar } from 'lucide-react';
import { SquashMember, FeedPost } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: SquashMember[];
  currentUser?: SquashMember | null;
  onAddPost: (post: Omit<FeedPost, 'id' | 'niceShots' | 'isNiceShotGiven' | 'isBookmarked' | 'comments' | 'commentsCount'>) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  onAddPost,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMemberId, setSelectedMemberId] = useState(currentUser?.id || members[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80'
  );
  const [location, setLocation] = useState('서울 탄천 스쿼시 코트');
  const [matchDuration, setMatchDuration] = useState('총 95분 혈투');
  const [setScore, setSetScore] = useState('세트 스코어 3:0');
  const [badgeTag, setBadgeTag] = useState('PRO MATCH');
  const [badgeType, setBadgeType] = useState<'pro' | 'kit' | 'trophy' | 'regular'>('pro');
  const [category, setCategory] = useState<'all' | 'match' | 'awards'>('match');

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];

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

  const sampleSquashImages = [
    {
      title: '우승 트로피 세레머니',
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: '스쿼시 라켓 & 볼 컬렉션',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: '역동적인 경기 랠리',
      url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: '스쿼시 클럽 공식 단체 코트',
      url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      alert('게시글 내용을 입력해 주세요.');
      return;
    }

    onAddPost({
      authorId: currentMember.id,
      authorName: currentMember.name,
      authorAvatar: currentMember.avatar,
      authorBadge: currentMember.role === 'captain' ? 'CAPTAIN' : currentMember.roleLabel,
      isCaptain: currentMember.role === 'captain',
      timeAgo: '방금 전',
      location: location || '클럽 코트',
      badgeTag: badgeTag || undefined,
      badgeType,
      imageUrl,
      caption,
      matchDuration: matchDuration || undefined,
      setScore: setScore || undefined,
      category,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#161822] border border-white/[0.12] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-[#11131a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#f5c200]">📷</span>
            <h2 className="font-chivo font-black text-base text-white">
              사진 촬영 / 즉시 피드 업로드
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {/* Author Selection */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              게시자 선택
            </label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all cursor-pointer ${
                    selectedMemberId === m.id
                      ? 'bg-[#f5c200] text-[#0f1118] font-bold border-[#f5c200]'
                      : 'bg-[#11131a] text-gray-300 border-white/10'
                  }`}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              공지 분류 태그
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('match');
                  setBadgeTag('PRO MATCH');
                  setBadgeType('pro');
                }}
                className={`py-2 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer ${
                  category === 'match'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200]'
                    : 'bg-[#11131a] text-gray-400 border-white/10'
                }`}
              >
                🔥 게임/매치
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('awards');
                  setBadgeTag('CHAMPIONSHIP');
                  setBadgeType('trophy');
                }}
                className={`py-2 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer ${
                  category === 'awards'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200]'
                    : 'bg-[#11131a] text-gray-400 border-white/10'
                }`}
              >
                🏆 대회/수상
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setBadgeTag('CLUB EVENT');
                  setBadgeType('regular');
                }}
                className={`py-2 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer ${
                  category === 'all'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200]'
                    : 'bg-[#11131a] text-gray-400 border-white/10'
                }`}
              >
                📢 일반 공지
              </button>
            </div>
          </div>

          {/* Photo Selection / Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-chivo font-bold text-gray-300 flex items-center gap-1">
                <Camera size={13} className="text-[#f5c200]" />
                <span>사진 선택 또는 직접 업로드</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#f5c200] hover:underline font-chivo font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>내 기기에서 사진 찾기</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview & Samples */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {sampleSquashImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(img.url)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    imageUrl === img.url
                      ? 'border-[#f5c200] scale-105 shadow-md'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/40">
              <img
                src={imageUrl}
                alt="Selected"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              공지 / 경기 내용 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="스쿼시 경기 결과나 클럽 공지사항을 작성해주세요..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200] resize-none"
              required
            />
          </div>

          {/* Match Score & Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
                <span>경기 스코어</span>
              </label>
              <input
                type="text"
                value={setScore}
                onChange={(e) => setSetScore(e.target.value)}
                placeholder="예: 3:0 완승"
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-[#f5c200]" />
                <span>경기 시간</span>
              </label>
              <input
                type="text"
                value={matchDuration}
                onChange={(e) => setMatchDuration(e.target.value)}
                placeholder="예: 총 60분 경기"
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
              placeholder="예: 서울 탄천 스쿼시 코트"
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-300 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-[0_4px_16px_rgba(245,194,0,0.3)] active:scale-[0.98] transition-all cursor-pointer"
            >
              즉시 피드 업로드
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
