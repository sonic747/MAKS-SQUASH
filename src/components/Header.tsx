import React from 'react';
import { MaksLogo } from './MaksLogo';
import { TabType, SquashMember } from '../types';
import { LogOut, RefreshCw, CloudCheck, Cloud } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  title?: string;
  isSyncing?: boolean;
  cloudConnected?: boolean;
  currentUser?: SquashMember | null;
  selectedMember?: SquashMember;
  pushSubscribed?: boolean;
  onOpenPushPrompt?: () => void;
  onLogout?: () => void;
  onOpenGate?: () => void;
  onSyncNow?: () => void;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  title,
  isSyncing,
  cloudConnected = true,
  currentUser,
  pushSubscribed,
  onOpenPushPrompt,
  onLogout,
  onSyncNow,
  onManualSync,
}) => {
  const handleSync = onSyncNow || onManualSync;

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
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-gray-400 text-xs hidden sm:inline">|</span>
            <span className="text-white text-xs font-chivo font-black tracking-wide truncate">
              {getTabTitle()}
            </span>
          </div>
        </div>

        {/* Right Action Icons: Cloud Realtime Badge, Sync Button, Current User & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Real-time Cloud Status */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-chivo font-bold border transition-colors ${
              cloudConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
            }`}
            title="스마트폰과 PC 웹 브라우저가 클라우드 실시간 데이터베이스로 즉시 동기화됩니다."
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="hidden xs:inline">실시간 연동</span>
          </div>

          {/* Web Push (Google FCM) Notification Icon */}
          {onOpenPushPrompt && (
            <button
              onClick={onOpenPushPrompt}
              title={pushSubscribed ? '푸시 알림 구독 중 (클릭 시 상태 확인)' : '구글 FCM 푸시 알림 신청하기'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-chivo font-bold transition-all cursor-pointer ${
                pushSubscribed
                  ? 'bg-[#f5c200]/15 border-[#f5c200]/40 text-[#f5c200]'
                  : 'bg-[#161822] hover:bg-[#1e222d] border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <span className="text-xs">🔔</span>
              <span className="text-[10px] hidden sm:inline">
                {pushSubscribed ? '푸시 ON' : '푸시 알림'}
              </span>
            </button>
          )}

          {/* Sync Now Button */}
          {handleSync && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="클라우드 실시간 동기화 확인"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#161822] hover:bg-[#1e222d] text-gray-300 hover:text-white border border-white/10 text-xs font-chivo font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin text-[#f5c200]' : ''} />
              <span className="text-[11px] hidden sm:inline">동기화</span>
            </button>
          )}

          {/* Current User Profile Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-[#181a24] border border-white/10">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-[#f5c200]/50"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-chivo font-bold text-gray-200 max-w-[70px] truncate">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="text-gray-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[#f5c200] text-[11px] font-chivo font-bold">
              게스트
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
