import React, { useState, useRef } from 'react';
import { X, Trophy, Camera, Award, Sparkles } from 'lucide-react';
import { SquashMember, HonorItem, MemberPhoto } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface AddHonorOrPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: SquashMember;
  onAddHonor: (memberId: string, honor: Omit<HonorItem, 'id'>) => void;
  onAddPhoto: (memberId: string, photo: Omit<MemberPhoto, 'id'>) => void;
}

export const AddHonorOrPhotoModal: React.FC<AddHonorOrPhotoModalProps> = ({
  isOpen,
  onClose,
  member,
  onAddHonor,
  onAddPhoto,
}) => {
  const [tab, setTab] = useState<'photo' | 'honor'>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo form state
  const [photoTag, setPhotoTag] = useState('코트 훈련 샷');
  const [photoTitle, setPhotoTitle] = useState('스쿼시 파워 드라이브 드릴');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
  );

  // Honor form state
  const [honorTitle, setHonorTitle] = useState('2024 경기도협회장배 스쿼시 대회');
  const [organizer, setOrganizer] = useState('경기도스쿼시연맹 공인 • 개인전');
  const [rank, setRank] = useState('1위');
  const [rankBadge, setRankBadge] = useState('CHAMPION');
  const [rankType, setRankType] = useState<'gold' | 'silver' | 'bronze'>('gold');
  const [matchScore, setMatchScore] = useState('전승 우승 4-0');

  if (!isOpen) return null;

  const handlePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPhoto(member.id, {
      tag: photoTag,
      title: photoTitle,
      imageUrl: photoUrl,
    });
    onClose();
  };

  const handleHonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHonor(member.id, {
      title: honorTitle,
      organizer,
      rank,
      rankBadge,
      rankType,
      date: new Date().toISOString().split('T')[0],
      matchScore,
      division: '일반부',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#161822] border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-[#11131a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#f5c200]">🏆</span>
            <h3 className="font-chivo font-black text-sm text-white">
              {member.name} 님의 히스토리 추가
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-md">
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-[#11131a] border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setTab('photo')}
            className={`py-2 text-xs font-chivo font-bold rounded-lg transition-all ${
              tab === 'photo'
                ? 'bg-[#1e222d] text-[#f5c200] border border-white/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📷 운동/히스토리 사진
          </button>
          <button
            type="button"
            onClick={() => setTab('honor')}
            className={`py-2 text-xs font-chivo font-bold rounded-lg transition-all ${
              tab === 'honor'
                ? 'bg-[#1e222d] text-[#f5c200] border border-white/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 새 시상 이력 등록
          </button>
        </div>

        {/* Content */}
        {tab === 'photo' ? (
          <form onSubmit={handlePhotoSubmit} className="p-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                사진 미리보기
              </label>
              <div className="aspect-video rounded-xl overflow-hidden bg-[#0c0e15] border border-white/10 mb-2">
                <img
                  src={photoUrl}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const compressed = await compressImageFile(file, {
                        maxWidth: 1280,
                        maxHeight: 1280,
                        quality: 0.8,
                        maxSizeBytes: 400 * 1024,
                      });
                      setPhotoUrl(compressed);
                    } catch (err) {
                      const r = new FileReader();
                      r.onload = () => typeof r.result === 'string' && setPhotoUrl(r.result);
                      r.readAsDataURL(file);
                    }
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded bg-[#1e222d] border border-white/10 text-xs font-chivo font-bold text-white flex items-center justify-center gap-1.5"
              >
                <Camera size={14} />
                <span>기기에서 사진 업로드</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                태그 구분 (예: 코트 훈련 샷, 기어 셋업, 대회 시상대)
              </label>
              <input
                type="text"
                value={photoTag}
                onChange={(e) => setPhotoTag(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                사진 설명
              </label>
              <input
                type="text"
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                required
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#11131a] border border-white/10 text-xs font-chivo font-bold text-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs shadow-md active:scale-95"
              >
                사진 히스토리에 추가
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleHonorSubmit} className="p-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                대회 명칭
              </label>
              <input
                type="text"
                value={honorTitle}
                onChange={(e) => setHonorTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                주관 및 부문 설명
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                  순위 결과
                </label>
                <select
                  value={rank}
                  onChange={(e) => {
                    setRank(e.target.value);
                    if (e.target.value === '1위') {
                      setRankBadge('CHAMPION');
                      setRankType('gold');
                    } else if (e.target.value === '2위') {
                      setRankBadge('RUNNER-UP');
                      setRankType('silver');
                    } else {
                      setRankBadge('3RD PLACE');
                      setRankType('bronze');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                >
                  <option value="1위">1위 🥇 (우승)</option>
                  <option value="2위">2위 🥈 (준우승)</option>
                  <option value="3위">3위 🥉 (동메달)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
                  경기 결과 메모
                </label>
                <input
                  type="text"
                  value={matchScore}
                  onChange={(e) => setMatchScore(e.target.value)}
                  placeholder="예: 전승 우승 5-0"
                  className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#11131a] border border-white/10 text-xs font-chivo font-bold text-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs shadow-md active:scale-95"
              >
                명예의 전당 등록
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
