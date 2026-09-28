import React, { useState } from 'react';
import { X, ThumbsUp, Send } from 'lucide-react';
import { SquashMember } from '../types';

interface AddCheerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: SquashMember;
  allMembers: SquashMember[];
  onAddCheer: (targetMemberId: string, authorName: string, text: string) => void;
}

export const AddCheerModal: React.FC<AddCheerModalProps> = ({
  isOpen,
  onClose,
  targetMember,
  allMembers,
  onAddCheer,
}) => {
  const [authorName, setAuthorName] = useState('이진욱');
  const [cheerText, setCheerText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheerText.trim()) return;

    onAddCheer(targetMember.id, authorName, cheerText.trim());
    setCheerText('');
    onClose();
  };

  const presetCheers = [
    '캡틴 지난 경기 백핸드 크로스 진짜 예술이었습니다! 🔥',
    '전국대회 단체전 우승 다시 봐도 소름... A팀 든든합니다 🏆',
    '오늘 저녁 7시 정기 매치도 멋진 랠리 부탁드립니다! ⚡',
    '항상 클럽을 위해 솔선수범해 주셔서 감사합니다! 파이팅!',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#161822] border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200">
        <div className="px-4 py-3 bg-[#11131a] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} className="text-[#f5c200]" />
            <h3 className="font-chivo font-black text-sm text-white">
              {targetMember.name} 님에게 동료 응원 남기기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              작성자 이름
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#f5c200]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-chivo font-bold text-gray-300 mb-1">
              응원 메시지
            </label>
            <textarea
              rows={3}
              value={cheerText}
              onChange={(e) => setCheerText(e.target.value)}
              placeholder="동료에게 힘이 되는 응원과 찬사를 전해주세요!"
              className="w-full px-3 py-2 rounded-lg bg-[#11131a] border border-white/10 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#f5c200] leading-relaxed"
              required
            />
          </div>

          {/* Quick preset recommendations */}
          <div>
            <span className="text-[10px] text-gray-400 font-chivo block mb-1.5">
              빠른 응원 문구 선택:
            </span>
            <div className="space-y-1">
              {presetCheers.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCheerText(preset)}
                  className="w-full text-left p-1.5 rounded bg-[#11131a] hover:bg-[#1e222d] border border-white/[0.06] text-[11px] text-gray-300 truncate transition-colors"
                >
                  "{preset}"
                </button>
              ))}
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
              className="flex-1 py-2.5 px-3 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs shadow-md active:scale-95 transition-all"
            >
              응원 등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
