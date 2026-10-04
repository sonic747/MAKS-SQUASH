import React, { useState, useRef, useEffect } from 'react';
import { X, Trophy, Camera, Image, Sparkles, Trash2 } from 'lucide-react';
import { SquashMember, HonorItem, MemberPhoto } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface AddHonorOrPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: SquashMember;
  onAddHonor: (memberId: string, honor: Omit<HonorItem, 'id'>) => void;
  onUpdateHonor?: (memberId: string, honor: HonorItem) => void;
  onDeleteHonor?: (memberId: string, honorId: string) => void;
  editingHonor?: HonorItem | null;
  onAddPhoto?: (memberId: string, photo: Omit<MemberPhoto, 'id'>) => void;
}

export const AddHonorOrPhotoModal: React.FC<AddHonorOrPhotoModalProps> = ({
  isOpen,
  onClose,
  member,
  onAddHonor,
  onUpdateHonor,
  onDeleteHonor,
  editingHonor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Honor form state
  const [honorTitle, setHonorTitle] = useState('2024 경기도협회장배 스쿼시 대회');
  const [organizer, setOrganizer] = useState('경기도스쿼시연맹 공인 • 개인전');
  const [rank, setRank] = useState('1위');
  const [rankBadge, setRankBadge] = useState('CHAMPION');
  const [rankType, setRankType] = useState<'gold' | 'silver' | 'bronze'>('gold');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  useEffect(() => {
    if (editingHonor) {
      setHonorTitle(editingHonor.title || '');
      setOrganizer(editingHonor.organizer || '');
      setRank(editingHonor.rank || '1위');
      setRankBadge(editingHonor.rankBadge || 'CHAMPION');
      setRankType(editingHonor.rankType || 'gold');
      setImageUrl(editingHonor.imageUrl || '');
    } else {
      setHonorTitle('2024 경기도협회장배 스쿼시 대회');
      setOrganizer('경기도스쿼시연맹 공인 • 개인전');
      setRank('1위');
      setRankBadge('CHAMPION');
      setRankType('gold');
      setImageUrl('');
    }
  }, [editingHonor, isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1800,
        quality: 0.8,
        maxSizeBytes: 400 * 1024,
      });
      setImageUrl(compressed);
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
  };

  const handleHonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHonor && onUpdateHonor) {
      onUpdateHonor(member.id, {
        ...editingHonor,
        title: honorTitle,
        organizer,
        rank,
        rankBadge,
        rankType,
        imageUrl: imageUrl || undefined,
      });
    } else {
      onAddHonor(member.id, {
        title: honorTitle,
        organizer,
        rank,
        rankBadge,
        rankType,
        date: new Date().toISOString().split('T')[0],
        division: '일반부',
        imageUrl: imageUrl || undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingHonor && onDeleteHonor) {
      if (confirm('이 시상 이력을 정말 삭제하시겠습니까?')) {
        onDeleteHonor(member.id, editingHonor.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#161822] border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header: 시상 등록 / 시상 수정 */}
        <div className="px-4 py-3 bg-[#11131a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#f5c200]" />
            <h3 className="font-chivo font-black text-sm text-white">
              {member.name} 님의 {editingHonor ? '시상 이력 수정' : '시상 등록'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {editingHonor && onDeleteHonor && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 p-1 rounded-md cursor-pointer transition-colors"
                title="시상 이력 삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleHonorSubmit} className="p-4 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {/* 대회 명칭 */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              대회 명칭
            </label>
            <input
              type="text"
              value={honorTitle}
              onChange={(e) => setHonorTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              placeholder="예: 2024 제15회 전국 클럽 스쿼시 선수권 대회"
              required
            />
          </div>

          {/* 주관 및 부문 설명 */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              주관 및 부문 설명
            </label>
            <input
              type="text"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              placeholder="예: 대한스쿼시연맹 공인 • 개인전 남자부"
              required
            />
          </div>

          {/* 순위 결과 */}
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
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200] cursor-pointer"
            >
              <option value="1위">1위 🥇 (우승 - CHAMPION)</option>
              <option value="2위">2위 🥈 (준우승 - RUNNER-UP)</option>
              <option value="3위">3위 🥉 (동메달 - 3RD PLACE)</option>
            </select>
          </div>

          {/* 사진 첨부 섹션: 사진선택 / 사진촬영 및 세로 4:2 (2:1) 세워서 표시 */}
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1.5">
              시상 및 상장/메달 사진 (선택)
            </label>

            {/* Hidden file inputs: Gallery & Camera capture */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />

            {/* Two Action Buttons: 사진 선택 & 사진 촬영 */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#1e222d] hover:bg-[#272b38] border border-white/15 text-xs font-chivo font-bold text-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Image size={15} className="text-[#f5c200]" />
                <span>사진선택</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-[#1e222d] hover:bg-[#272b38] border border-white/15 text-xs font-chivo font-bold text-gray-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Camera size={15} className="text-emerald-400" />
                <span>사진촬영</span>
              </button>
            </div>

            {/* Photo Preview: 세로 4 대 가로 2 (1:2 ratio) 비율로 세워서 표시 */}
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-[#0c0e15] border border-[#f5c200]/40 mx-auto max-w-[200px] shadow-lg" style={{ aspectRatio: '1 / 2' }}>
                <img
                  src={imageUrl}
                  alt="시상 사진 미리보기"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/75 text-white hover:text-red-400 cursor-pointer"
                  title="사진 삭제"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-center py-1 text-[10px] text-[#f5c200] font-bold">
                  세로형 (4:2) 사진 등록됨
                </div>
              </div>
            ) : isCompressing ? (
              <div className="rounded-xl border border-dashed border-white/20 p-6 text-center text-xs text-gray-400 font-chivo">
                <Sparkles size={16} className="mx-auto text-[#f5c200] animate-spin mb-1" />
                <span>사진 압축 처리 중...</span>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-gray-400 font-chivo cursor-pointer hover:border-white/30 transition-colors"
              >
                <Camera size={20} className="mx-auto text-gray-500 mb-1" />
                <span className="text-[11px]">사진을 선택하거나 촬영하시면 세로(4:2)로 세워서 미리보기가 표시됩니다.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-3 rounded-xl bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-300 cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-3 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {editingHonor ? '수정 내용 저장' : '시상 등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
