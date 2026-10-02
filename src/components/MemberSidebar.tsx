import React from 'react';
import { UserPlus } from 'lucide-react';
import { SquashMember } from '../types';

interface MemberSidebarProps {
  members: SquashMember[];
  maxCapacity: number;
  selectedMemberId: string;
  isLoading?: boolean;
  onSelectMember: (memberId: string) => void;
  onAddMemberClick: () => void;
  onMemberDoubleTap?: (member: SquashMember) => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({
  members,
  maxCapacity,
  selectedMemberId,
  isLoading = false,
  onSelectMember,
  onAddMemberClick,
}) => {
  return (
    <aside className="w-[72px] sm:w-20 shrink-0 bg-[#0c0e15] border-r border-white/[0.08] flex flex-col items-center py-3 select-none">
      {/* Capacity Counter */}
      <div className="flex flex-col items-center mb-3">
        <div className="px-2 py-0.5 rounded-full bg-[#f5c200] text-[#0f1118] font-chivo font-black text-[11px] shadow-sm tracking-tight">
          {members.length} / {maxCapacity}
        </div>
        <span className="text-[10px] font-chivo font-bold tracking-wider text-gray-400 mt-1 uppercase">
          MEMBERS
        </span>
      </div>

      {/* Member Avatar List */}
      <div className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto overflow-x-hidden no-scrollbar px-1 py-1">
        {isLoading && members.length === 0 ? (
          [1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="flex flex-col items-center w-full animate-pulse gap-1 py-1">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/5" />
              <div className="w-8 h-2.5 rounded bg-white/[0.06]" />
              <div className="w-6 h-2 rounded bg-white/[0.04]" />
            </div>
          ))
        ) : (
          members.map((member) => {
            const isSelected = selectedMemberId === member.id;
            const isCaptain = member.role === 'captain';

            return (
              <button
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className="group flex flex-col items-center w-full focus:outline-none transition-transform active:scale-95 cursor-pointer"
                title={`${member.name} (${member.roleLabel})`}
              >
                <div className="relative">
                  {/* Avatar container */}
                  <div
                    className={`w-12 h-12 rounded-xl overflow-hidden p-0.5 transition-all duration-200 ${
                      isSelected || isCaptain
                        ? 'ring-2 ring-[#f5c200] shadow-[0_0_12px_rgba(245,194,0,0.35)]'
                        : 'border border-white/20 opacity-85 group-hover:opacity-100 group-hover:border-white/50'
                    }`}
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover rounded-[10px]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                  </div>

                  {/* Status Dot */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0c0e15]"
                    style={{ backgroundColor: member.statusColor || '#10b981' }}
                  />

                  {/* Captain Badge Indicator */}
                  {isCaptain && (
                    <div className="absolute -top-1 -right-1 bg-[#c62828] text-white text-[8px] font-black px-1 rounded-sm shadow">
                      C
                    </div>
                  )}
                </div>

                {/* Name */}
                <span
                  className={`text-[12px] font-semibold mt-1 truncate max-w-[62px] text-center leading-tight ${
                    isSelected ? 'text-[#f5c200] font-bold' : 'text-gray-200'
                  }`}
                >
                  {member.name}
                </span>

                {/* Role / Tenure Tag */}
                <span
                  className={`text-[10px] truncate max-w-[62px] text-center font-chivo font-medium ${
                    isCaptain ? 'text-[#f5c200] font-bold' : 'text-gray-400'
                  }`}
                >
                  {member.roleLabel}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Add Member Button at Bottom */}
      <div className="w-full px-2 pt-2 border-t border-white/[0.08]">
        <button
          onClick={onAddMemberClick}
          className="w-full py-2 px-1 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-all cursor-pointer"
          title="신규 회원 등록"
        >
          <UserPlus size={16} strokeWidth={2.5} />
          <span className="text-[10px] leading-tight font-bold">추가</span>
        </button>
      </div>
    </aside>
  );
};
