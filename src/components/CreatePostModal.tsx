import React, { useState, useRef } from 'react';
import { X, Camera, FolderOpen, MapPin, Clock, Trophy, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { SquashMember, FeedPost } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: SquashMember[];
  currentUser?: SquashMember | null;
  onAddPost: (
    post: Omit<FeedPost, 'id' | 'niceShots' | 'isNiceShotGiven' | 'isBookmarked' | 'comments' | 'commentsCount'>,
    sendPush?: boolean
  ) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  onAddPost,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedMemberId, setSelectedMemberId] = useState(currentUser?.id || members[0]?.id || '');
  const [category, setCategory] = useState<'all' | 'awards' | 'match'>('all');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [caption, setCaption] = useState('');

  // 게임/매치 전용 필드 (경기스코어, 경기시간, 장소)
  const [setScore, setSetScore] = useState('');
  const [matchDuration, setMatchDuration] = useState('');
  const [location, setLocation] = useState('서울 탄천 스쿼시 코트');

  // 대회/수상 전용 필드 (수상내역)
  const [awardsDetail, setAwardsDetail] = useState('');

  // 웹 푸시 알림 동시 발송 옵션
  const [sendPushNotification, setSendPushNotification] = useState(true);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        // Automatically compress image client-side to be under 400KB so Firestore 1MB limit is never exceeded
        const compressedBase64 = await compressImageFile(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.8,
          maxSizeBytes: 400 * 1024,
        });
        setImageUrl(compressedBase64);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
    // reset input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      alert('공지 / 경기 내용을 작성해주세요.');
      return;
    }

    // Default image if user didn't upload a photo
    const finalImage =
      imageUrl ||
      (category === 'awards'
        ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80'
        : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80');

    let badgeTag: string | undefined = undefined;
    let badgeType: 'pro' | 'kit' | 'trophy' | 'regular' = 'regular';

    if (category === 'match') {
      badgeTag = 'GAME / MATCH';
      badgeType = 'pro';
    } else if (category === 'awards') {
      badgeTag = awardsDetail ? `🏆 ${awardsDetail}` : 'CHAMPIONSHIP';
      badgeType = 'trophy';
    } else {
      badgeTag = 'NOTICE';
      badgeType = 'regular';
    }

    onAddPost({
      authorId: currentMember.id,
      authorName: currentMember.name,
      authorAvatar: currentMember.avatar,
      authorBadge: currentMember.role === 'captain' ? 'CAPTAIN' : currentMember.roleLabel,
      isCaptain: currentMember.role === 'captain',
      timeAgo: '방금 전',
      location: category === 'match' ? (location.trim() || '클럽 코트') : 'MAKS 스쿼시 클럽',
      badgeTag,
      badgeType,
      imageUrl: finalImage,
      caption: caption.trim(),
      matchDuration: category === 'match' ? matchDuration.trim() || undefined : undefined,
      setScore: category === 'match' ? setScore.trim() || undefined : undefined,
      awardsDetail: category === 'awards' ? awardsDetail.trim() || undefined : undefined,
      category,
    }, sendPushNotification);

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
            className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[82vh] overflow-y-auto no-scrollbar">
          {/* Author Selection */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1.5">
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
                      ? 'bg-[#f5c200] text-[#0f1118] font-bold border-[#f5c200] shadow-sm'
                      : 'bg-[#11131a] text-gray-300 border-white/10 hover:border-white/20'
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

          {/* Category Tabs: 일반 공지 (기본), 대회/수상, 게임/매치 순서 */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1.5">
              공지 분류 태그
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`py-2.5 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  category === 'all'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200] shadow-md font-extrabold'
                    : 'bg-[#11131a] text-gray-400 border-white/10 hover:text-gray-200'
                }`}
              >
                <span>📢</span>
                <span>일반 공지</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('awards')}
                className={`py-2.5 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  category === 'awards'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200] shadow-md font-extrabold'
                    : 'bg-[#11131a] text-gray-400 border-white/10 hover:text-gray-200'
                }`}
              >
                <span>🏆</span>
                <span>대회/수상</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('match')}
                className={`py-2.5 text-xs font-chivo font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  category === 'match'
                    ? 'bg-[#f5c200] text-[#0f1118] border-[#f5c200] shadow-md font-extrabold'
                    : 'bg-[#11131a] text-gray-400 border-white/10 hover:text-gray-200'
                }`}
              >
                <span>🔥</span>
                <span>게임/매치</span>
              </button>
            </div>
          </div>

          {/* Photo Selection: 파일선택 & 사진촬영 버튼 (샘플 그림 완전 제거) */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1.5">
              사진 등록 (파일 선택 / 사진 촬영)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* File Select Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#1e222d] hover:bg-[#282d3c] border border-white/10 hover:border-white/25 text-xs font-chivo font-bold text-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FolderOpen size={16} className="text-[#f5c200]" />
                <span>파일 선택</span>
              </button>

              {/* Camera Capture Input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#1e222d] hover:bg-[#282d3c] border border-white/10 hover:border-white/25 text-xs font-chivo font-bold text-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Camera size={16} className="text-[#f5c200]" />
                <span>사진 촬영</span>
              </button>
            </div>

            {/* Image Preview or Placeholder */}
            {isCompressing ? (
              <div className="aspect-video rounded-xl border border-dashed border-[#f5c200]/50 bg-[#11131a] flex flex-col items-center justify-center text-[#f5c200] gap-2 p-4 text-center animate-pulse">
                <Loader2 size={26} className="animate-spin text-[#f5c200]" />
                <span className="text-xs font-chivo font-bold">고화질 사진 최적화 및 용량 압축 중...</span>
                <span className="text-[10px] text-gray-400">1MB 클라우드 제한 자동 최적화</span>
              </div>
            ) : imageUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 bg-black/50 group">
                <img
                  src={imageUrl}
                  alt="선택된 사진"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                  title="사진 삭제"
                >
                  <Trash2 size={14} />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] text-emerald-400 font-chivo font-bold flex items-center gap-1">
                  <span>✓ 사진 최적화 완료 (클라우드 초고속 동기화)</span>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-xl border border-dashed border-white/15 bg-[#11131a]/60 flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4 text-center">
                <Camera size={26} className="text-gray-500" />
                <span className="text-xs font-chivo text-gray-400 font-semibold">
                  위의 [파일 선택] 또는 [사진 촬영] 버튼을 눌러주세요
                </span>
                <span className="text-[11px] text-gray-500 font-sans">
                  사진 없이도 기본 클럽 그래픽으로 업로드 가능합니다
                </span>
              </div>
            )}
          </div>

          {/* Conditional Fields based on Category */}

          {/* 1. [게임/매치] 선택 시: 경기스코어, 경기시간, 장소 */}
          {category === 'match' && (
            <div className="space-y-3 p-3 rounded-xl bg-[#11131a]/80 border border-white/10 animate-in fade-in duration-150">
              <div className="text-[11px] font-chivo font-black text-[#f5c200] flex items-center gap-1.5">
                <span>🔥</span>
                <span>게임 / 매치 상세 정보</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center gap-1">
                    <span>🎾 경기 스코어</span>
                  </label>
                  <input
                    type="text"
                    value={setScore}
                    onChange={(e) => setSetScore(e.target.value)}
                    placeholder="예: 세트 스코어 3:0"
                    className="w-full px-3 py-2 rounded-lg bg-[#161822] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200]"
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
                    className="w-full px-3 py-2 rounded-lg bg-[#161822] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200]"
                  />
                </div>
              </div>

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
                  className="w-full px-3 py-2 rounded-lg bg-[#161822] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200]"
                />
              </div>
            </div>
          )}

          {/* 2. [대회/수상] 선택 시: 수상내역만 입력 (예: 청주스쿼시대회 S1 우승) */}
          {category === 'awards' && (
            <div className="space-y-2 p-3 rounded-xl bg-[#11131a]/80 border border-white/10 animate-in fade-in duration-150">
              <div className="text-[11px] font-chivo font-black text-[#f5c200] flex items-center gap-1.5">
                <Trophy size={13} className="text-[#f5c200]" />
                <span>대회 / 수상 상세 정보</span>
              </div>
              <div>
                <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                  수상내역 입력 <span className="text-[#f5c200]">*</span>
                </label>
                <input
                  type="text"
                  value={awardsDetail}
                  onChange={(e) => setAwardsDetail(e.target.value)}
                  placeholder="예: 청주스쿼시대회 S1 우승"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#161822] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200]"
                />
                <p className="text-[10px] text-gray-400 mt-1 font-sans">
                  대회명 및 수상 등급을 입력하시면 피드 상단 뱃지와 배너에 공식 기록됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 3. [공통 / 일반공지]: "공지 / 경기 내용" 만 나오도록 */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1 flex items-center justify-between">
              <span>
                공지 / 경기 내용 <span className="text-red-400">*</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">필수</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                category === 'match'
                  ? '경기 내용과 스코어, 랠리 후기를 입력해주세요...'
                  : category === 'awards'
                  ? '대회 결과 및 축하 메시지를 입력해주세요...'
                  : '스쿼시 클럽 공지사항 및 전달사항을 입력해주세요...'
              }
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c200] resize-none leading-relaxed"
              required
            />
          </div>

          {/* App Icon Unread Badge Notice */}
          <div className="p-3 rounded-xl bg-[#11131a] border border-[#f5c200]/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[#f5c200] text-sm">🔴</span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-chivo font-black text-white flex items-center gap-1.5">
                  <span>바탕화면 MAKS 아이콘 뱃지 자동 카운트</span>
                </span>
                <span className="text-[10px] text-gray-400 truncate">
                  새 공지가 등록되면 PC 및 모바일 바탕화면 아이콘에 읽지 않은 수량이 표시됩니다
                </span>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">
              자동 반영
            </div>
          </div>

          {/* Bottom Buttons: 취소 & 즉시 피드 업로드 */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-300 cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-[0_4px_16px_rgba(245,194,0,0.3)] active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              즉시 피드 업로드
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
