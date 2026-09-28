import React from 'react';
import { MaksLogo } from './MaksLogo';
import { TabType, SquashMember } from '../types';
import { LogOut, RefreshCw, CheckCircle } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  title?: string;
  isSyncing?: boolean;
  currentUser?: SquashMember | null;
  onLogout?: () => void;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  title,
  isSyncing,
  currentUser,
  onLogout,
  onManualSync,
}) => {
  const getTabTitle = () => {
    if (title) return title;
    switch (currentTab) {
      case 'feed':
        return '클럽 공지';
      case 'members':
        return '클럽 회원목록';
      case 'trophies':
        return '명예의 전당';
      case 'register':
        return '신규 회원가입';
      case 'backup':
        return '데이터 백업관리';
      default:
        return '클럽 공지';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0f1118]/95 backdrop-blur-md border-b border-white/[0.08] px-3.5 py-2">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo and Active Tab Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <MaksLogo size="sm" />
          <div className="h-4 w-[1px] bg-white/20 hidden xs:block" />
          <h1 className="font-chivo font-extrabold text-base sm:text-lg tracking-tight text-white truncate">
            {getTabTitle()}
          </h1>
        </div>

        {/* Right: Cloud Sync Status, Current User Info and Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Real-time Cloud Sync button / status */}
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="모바일 ↔ PC 실시간 데이터 동기화"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#181b24] hover:bg-[#202534] border border-white/10 text-xs font-chivo text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw
                size={12}
                className={`text-[#f5c200] ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline text-[11px]">
                {isSyncing ? '동기화 중...' : '실시간 동기화'}
              </span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1c24] border border-white/10 text-white text-xs font-chivo">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-4 h-4 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="font-bold max-w-[80px] sm:max-w-[120px] truncate">{currentUser.name}</span>
                <span
                  className={`text-[10px] font-bold ${
                    currentUser.username === 'admin' || currentUser.role === 'admin' || currentUser.isAdmin
                      ? 'text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded'
                      : 'text-[#f5c200]'
                  }`}
                >
                  {currentUser.username === 'admin' || currentUser.role === 'admin' || currentUser.isAdmin
                    ? '관리자'
                    : '정회원'}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-1.5 rounded-full bg-[#1a1c24] hover:bg-red-950/60 text-gray-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1c24] border border-[#4e4632]/40 text-[#f5c200] text-[11px] font-chivo font-bold">
              <span className="text-xs">🔒</span>
              <span>로그인 필요</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
