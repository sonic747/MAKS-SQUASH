import React from 'react';
import { Trophy, Medal, Award, Calendar, Shield, Dna, Plus, MessageCircle, ChevronRight, Share2, UserCog } from 'lucide-react';
import { SquashMember, HonorItem, MemberPhoto, CheerMessage } from '../types';

interface TrophyRoomViewProps {
  member: SquashMember;
  allMembers: SquashMember[];
  currentUser?: SquashMember | null;
  onSelectMember: (memberId: string) => void;
  onOpenAddPhotoModal: () => void;
  onOpenCheerModal: () => void;
  onOpenImageModal: (imageUrl: string, title: string) => void;
  onOpenEditProfile?: (member: SquashMember) => void;
}

export const TrophyRoomView: React.FC<TrophyRoomViewProps> = ({
  member,
  allMembers,
  currentUser,
  onSelectMember,
  onOpenAddPhotoModal,
  onOpenCheerModal,
  onOpenImageModal,
  onOpenEditProfile,
}) => {
  const getRankColor = (rankType: HonorItem['rankType']) => {
    switch (rankType) {
      case 'gold':
        return 'text-[#f5c200]';
      case 'silver':
        return 'text-slate-300';
      case 'bronze':
        return 'text-amber-600';
      default:
        return 'text-white';
    }
  };

  const getRankBadgeBg = (rankType: HonorItem['rankType']) => {
    switch (rankType) {
      case 'gold':
        return 'bg-[#3e3412] text-[#f5c200] border-[#f5c200]/40';
      case 'silver':
        return 'bg-[#252833] text-slate-300 border-slate-500/40';
      case 'bronze':
        return 'bg-[#332219] text-amber-500 border-amber-600/40';
      default:
        return 'bg-[#1e222d] text-gray-300 border-white/10';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 pb-24">
      {/* Subheader: HONOR HALL OF FAME & CLUB PASS */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-1.5 text-[#f5c200] font-chivo font-black tracking-wider">
          <Trophy size={15} />
          <span>HONOR HALL OF FAME</span>
        </div>
        <div className="px-2 py-0.5 rounded bg-[#1e222d] border border-white/[0.08] text-gray-400 font-chivo font-semibold text-[11px]">
          CLUB PASS: <span className="text-white font-bold">{member.clubPass}</span>
        </div>
      </div>

      {/* Member Profile Card */}
      <div className="rounded-xl bg-[#161822] border border-white/[0.08] p-4 relative overflow-hidden shadow-lg">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5c200]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-start gap-3.5">
          {/* Avatar with yellow border */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden p-0.5 border-2 border-[#f5c200] shadow-[0_0_15px_rgba(245,194,0,0.25)]">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full h-full object-cover rounded-[8px]"
                referrerPolicy="no-referrer"
              />
            </div>
            {member.role === 'captain' && (
              <span className="absolute -bottom-1 -right-1 bg-[#c62828] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                KOR
              </span>
            )}
          </div>

          {/* Member Bio & Badges */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {member.role === 'captain' ? (
                <>
                  <span className="px-2 py-0.5 rounded bg-[#f5c200] text-[#0f1118] font-chivo font-black text-[11px] uppercase tracking-wider shadow-sm">
                    CAPTAIN
                  </span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e222d] border border-white/10 text-[10px] font-chivo font-bold text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-b from-[#c62828] to-[#1565c0]" />
                    <span>KOR</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#1e222d] border border-white/10 text-[10px] font-chivo font-bold text-gray-300">
                    A팀 에이스
                  </span>
                </>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#1e222d] text-[#f5c200] border border-[#f5c200]/30 font-chivo font-bold text-[11px]">
                  {member.roleLabel} • {member.ratingSub}
                </span>
              )}
            </div>

            {/* Name and Edit Button */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="font-chivo font-black text-xl sm:text-2xl text-white tracking-tight leading-none">
                {member.name}
              </h2>
              {onOpenEditProfile && (
                <button
                  onClick={() => onOpenEditProfile(member)}
                  className="px-2 py-1 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] text-xs font-chivo font-black flex items-center gap-1 shadow transition-all active:scale-95 shrink-0"
                >
                  <UserCog size={13} />
                  <span>개인정보 수정</span>
                </button>
              )}
            </div>

            {/* Korean / English Tagline */}
            <p className="text-xs text-gray-400 truncate">
              {member.bio || `${member.name} • MAKS 공인 클럽 마스터`}
            </p>
          </div>
        </div>

        {/* Member Specs Grid */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-[#f5c200] text-sm">📅</span>
            <div>
              <span className="text-gray-400 block text-[10px]">나이 / 스쿼시 등급</span>
              <span className="font-semibold text-white font-chivo">
                {member.age}세 • {member.ratingLabel || member.tenure}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-[#f5c200] text-sm">🛡</span>
            <div>
              <span className="text-gray-400 block text-[10px]">소속 구분</span>
              <span className="font-semibold text-white font-chivo">
                {member.primaryTeam || 'MAKS 스쿼시 클럽 공식 회원'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-chivo font-bold text-gray-400 shrink-0 mr-1">
          멤버 전환:
        </span>
        {allMembers.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMember(m.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-chivo font-semibold whitespace-nowrap transition-all ${
              m.id === member.id
                ? 'bg-[#f5c200] text-[#0f1118] font-bold'
                : 'bg-[#161822] text-gray-300 border border-white/[0.08] hover:border-white/20'
            }`}
          >
            {m.name} {m.role === 'captain' && '★'}
          </button>
        ))}
      </div>

      {/* Section: 🏆 시상 이력 룸 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-chivo font-extrabold text-base text-white">
            <span>🏆</span>
            <span>시상 이력 룸</span>
          </div>
          <span className="text-[11px] font-chivo font-bold tracking-wider text-[#f5c200]">
            CAREER HONORS: {member.honors.length < 10 ? `0${member.honors.length}` : member.honors.length}
          </span>
        </div>

        {member.honors.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#161822] border border-white/[0.08] text-center text-gray-400 text-xs">
            아직 등록된 수상 이력이 없습니다. 새 대회를 정복해 보세요!
          </div>
        ) : (
          <div className="space-y-2.5">
            {member.honors.map((honor) => (
              <div
                key={honor.id}
                className="p-3 sm:p-3.5 rounded-xl bg-[#161822] border border-white/[0.08] flex items-center justify-between gap-3 hover:border-white/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  {/* Badge & Date */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-chivo font-black tracking-wider uppercase border ${getRankBadgeBg(
                        honor.rankType
                      )}`}
                    >
                      {honor.rankBadge}
                    </span>
                    <span className="text-[11px] text-gray-400 font-chivo font-medium">
                      {honor.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-chivo font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                    {honor.title}
                  </h3>

                  {/* Subtitle / Organizer */}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {honor.organizer}
                  </p>

                  {/* Match Note */}
                  <div className="text-[11px] text-gray-300 font-chivo font-semibold mt-1">
                    {honor.matchScore}
                  </div>
                </div>

                {/* Right Rank Callout */}
                <div className="text-right shrink-0 flex items-center gap-1.5">
                  <span className={`font-chivo font-black text-lg sm:text-xl tracking-tight ${getRankColor(honor.rankType)}`}>
                    {honor.rank}
                  </span>
                  <span className="text-lg">
                    {honor.rankType === 'gold' ? '🥇' : honor.rankType === 'silver' ? '🥈' : '🥉'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: 📷 멤버의 스쿼시 히스토리 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-chivo font-extrabold text-base text-white">
            <span>📷</span>
            <span>{member.name} 님의 스쿼시 히스토리</span>
          </div>
          <span className="text-[11px] font-chivo font-bold text-gray-400">
            총 {member.photos.length}장
          </span>
        </div>

        {member.photos.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#161822] border border-white/[0.08] text-center text-gray-400 text-xs">
            등록된 운동 히스토리 사진이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {member.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onOpenImageModal(photo.imageUrl, photo.title)}
                className="relative aspect-square rounded-xl overflow-hidden bg-[#0c0e15] border border-white/[0.08] group cursor-pointer"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80';
                  }}
                />

                {/* Dark Gradient Overlay & Labels */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[10px] font-chivo font-black text-[#f5c200] tracking-wider uppercase">
                    {photo.tag}
                  </span>
                  <span className="text-xs font-bold text-white leading-tight truncate">
                    {photo.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: 💬 클럽 동료들의 응원 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-chivo font-extrabold text-base text-white">
            <span>💬</span>
            <span>클럽 동료들의 응원</span>
          </div>
          <span className="text-[11px] font-chivo font-bold text-gray-400">
            최근 {member.cheers.length}개
          </span>
        </div>

        <div className="space-y-2">
          {member.cheers.map((cheer) => (
            <div
              key={cheer.id}
              className="p-3 rounded-lg bg-[#161822] border border-white/[0.08] text-xs leading-relaxed"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-chivo font-bold text-[#f5c200]">
                  {cheer.author}
                </span>
                <span className="text-[10px] text-gray-400 font-chivo">
                  {cheer.timestamp}
                </span>
              </div>
              <p className="text-gray-200">
                "{cheer.text}"
              </p>
            </div>
          ))}

          {member.cheers.length === 0 && (
            <div className="p-4 rounded-lg bg-[#161822] border border-white/[0.08] text-center text-gray-400 text-xs">
              아직 남겨진 동료 응원이 없습니다. 첫 번째 응원 한마디를 남겨보세요!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={onOpenAddPhotoModal}
          className="w-full py-3.5 px-4 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,194,0,0.25)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>📷</span>
          <span>새 시상 / 운동 사진 추가하기</span>
        </button>

        <button
          onClick={onOpenCheerModal}
          className="w-full py-3 px-4 rounded-lg bg-[#1e222d] hover:bg-[#282d3c] border border-white/[0.12] text-white font-chivo font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>👍</span>
          <span>동료 응원 한마디 남기기</span>
        </button>
      </div>
    </div>
  );
};
