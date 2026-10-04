import React from 'react';
import { Flame, Users, Trophy, UserPlus, HardDrive, Lock } from 'lucide-react';
import { TabType, SquashMember } from '../types';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser?: SquashMember | null;
  unreadCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  unreadCount = 0,
}) => {
  const isAdmin = currentUser?.username === 'admin' || currentUser?.role === 'admin' || currentUser?.isAdmin;

  const navItems: { id: TabType; label: string; icon: React.ReactNode; adminOnly?: boolean; badge?: number }[] = [
    {
      id: 'feed',
      label: '공지',
      icon: <Flame size={19} strokeWidth={2.2} />,
      badge: unreadCount,
    },
    {
      id: 'members',
      label: '회원',
      icon: <Users size={19} strokeWidth={2.2} />,
    },
    {
      id: 'trophies',
      label: '명예',
      icon: <Trophy size={19} strokeWidth={2.2} />,
    },
    {
      id: 'backup',
      label: isAdmin ? '백업관리' : '백업(관리자)',
      icon: isAdmin ? (
        <HardDrive size={19} strokeWidth={2.2} />
      ) : (
        <div className="relative">
          <HardDrive size={18} strokeWidth={2.2} className="opacity-50" />
          <Lock size={10} className="absolute -top-1 -right-1.5 text-[#f5c200]" />
        </div>
      ),
      adminOnly: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e15]/95 backdrop-blur-md border-t border-white/[0.08] max-w-md mx-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const isItemDisabled = item.adminOnly && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isItemDisabled) {
                  alert('백업관리는 최고 관리자(admin) 계정으로 로그인한 경우에만 접근 가능합니다.');
                  return;
                }
                onTabChange(item.id);
              }}
              title={isItemDisabled ? '관리자(admin) 전용 기능' : undefined}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 focus:outline-none transition-colors relative ${
                isActive
                  ? 'text-[#f5c200]'
                  : isItemDisabled
                  ? 'text-gray-400 hover:text-gray-200 opacity-60 cursor-pointer'
                  : 'text-gray-400 hover:text-gray-200 cursor-pointer'
              }`}
            >
              <div className={`relative transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border border-[#0c0e15] shadow-sm animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wider font-chivo mt-1 ${isActive ? 'font-black' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
