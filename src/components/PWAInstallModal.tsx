import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Share, PlusSquare, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstalled?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstalled,
}) => {
  const { deferredPrompt, isInstalled, isIOS, isMobile, isKakaoOrInApp, triggerInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      // Remember user's choice so it does not pop up automatically next time
      localStorage.setItem('maks_pwa_prompt_dismissed', 'true');
    } catch (e) {
      // ignore
    }
    onClose();
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        const installed = await triggerInstall();
        if (installed) {
          setSuccess(true);
          try {
            localStorage.setItem('maks_pwa_installed', 'true');
            localStorage.setItem('maks_pwa_prompt_dismissed', 'true');
          } catch (e) {
            // ignore
          }
          if (onInstalled) onInstalled();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } catch (e) {
        console.error('Install prompt failed:', e);
      } finally {
        setInstalling(false);
      }
    } else if (isKakaoOrInApp) {
      // Direct user to open in Chrome or Safari
      try {
        const currentUrl = window.location.href;
        if (/android/i.test(navigator.userAgent)) {
          // Android intent to open in Chrome
          window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
        }
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#161822] border border-[#f5c200]/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md ring-2 ring-[#f5c200]/50 p-0.5 bg-[#0f1118]">
              <img
                src="/pwa-192x192.png"
                alt="MAKS App Icon"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f5c200]/20 text-[#f5c200] text-[10px] font-chivo font-black uppercase">
                <Sparkles size={11} />
                <span>단축 아이콘 자동 설치 안내</span>
              </div>
              <h3 className="font-chivo font-black text-lg text-white">
                바탕화면에 MAKS 바로가기 추가
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed">
          바탕화면에 <strong className="text-[#f5c200] font-bold">MAKS</strong> 아이콘을 추가하면 별도 앱스토어 설치 없이 1초 만에 바로 열리며, 새로운 공지가 등록되면 아이콘에 <strong className="text-white">읽지 않은 수량 뱃지</strong>가 자동으로 표시됩니다.
        </p>

        {/* Device-Specific Automatic Flow */}
        {isKakaoOrInApp ? (
          // KakaoTalk / In-App Browser Guidance
          <div className="p-3.5 rounded-xl bg-[#11131a] border border-amber-500/40 space-y-2.5 text-xs text-gray-200 font-chivo">
            <div className="flex items-center gap-2 text-[#f5c200] font-bold">
              <ExternalLink size={16} />
              <span>카카오톡 / 인앱 브라우저 감지됨</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              카카오톡 인앱 창에서는 보안상 바로가기 설치가 제한됩니다. <strong className="text-white">기본 브라우저(크롬/사파리)</strong>로 여시면 즉시 홈 화면 아이콘을 만들 수 있습니다.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0c0e15] border border-white/10 text-[11px] space-y-1 text-gray-300">
              <div>👉 우측 하단 <strong className="text-white">점 세 개(⋮)</strong> 또는 <strong className="text-white">공유 버튼</strong></div>
              <div>➔ <strong className="text-[#f5c200]">[다른 브라우저로 열기]</strong>를 누르시면 자동으로 설치 창이 뜹니다!</div>
            </div>
          </div>
        ) : isIOS ? (
          // iOS Safari instructions
          <div className="p-3.5 rounded-xl bg-[#11131a] border border-[#f5c200]/30 space-y-2.5 text-xs text-gray-300 font-chivo">
            <div className="flex items-center gap-2 text-white font-bold">
              <Smartphone size={16} className="text-[#f5c200]" />
              <span>아이폰(iOS Safari) 홈 화면 추가 (10초 완료)</span>
            </div>
            <div className="flex items-start gap-2.5 pl-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f5c200] text-[#0f1118] text-[11px] font-black shrink-0 mt-0.5">
                1
              </span>
              <span>사파리 브라우저 하단 중앙 <strong className="text-white inline-flex items-center gap-1">[공유 아이콘 <Share size={12} className="inline text-[#f5c200]" />]</strong> 터치</span>
            </div>
            <div className="flex items-start gap-2.5 pl-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f5c200] text-[#0f1118] text-[11px] font-black shrink-0 mt-0.5">
                2
              </span>
              <span>메뉴를 아래로 내려 <strong className="text-white inline-flex items-center gap-1">[홈 화면에 추가 <PlusSquare size={12} className="inline text-[#f5c200]" />]</strong> 선택</span>
            </div>
            <div className="flex items-start gap-2.5 pl-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f5c200] text-[#0f1118] text-[11px] font-black shrink-0 mt-0.5">
                3
              </span>
              <span>우측 상단 <strong className="text-[#f5c200] font-bold">[추가]</strong>를 누르면 스마트폰 바탕화면에 <strong className="text-white font-bold">MAKS</strong> 아이콘 생성 완료!</span>
            </div>
          </div>
        ) : (
          // Android Chrome / Samsung Internet & PC direct install flow
          <div className="p-3.5 rounded-xl bg-[#11131a] border border-white/10 space-y-2.5 text-xs text-gray-300 font-chivo">
            <div className="flex items-center gap-2 text-white font-bold">
              {isMobile ? (
                <Smartphone size={16} className="text-[#f5c200]" />
              ) : (
                <Monitor size={16} className="text-[#f5c200]" />
              )}
              <span>{isMobile ? '모바일 홈 화면 바로가기' : 'PC 바탕화면 / 작업표시줄 바로가기'}</span>
            </div>
            <div className="space-y-1.5 text-gray-300 pl-1">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>웹 브라우저 주소창 없이 네이티브 앱처럼 전체화면 1초 실행</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>새 공지 등록 시 아이콘에 <strong className="text-[#f5c200] font-bold">빨간 숫자 뱃지</strong> 자동 표시</span>
              </div>
              {isMobile && !deferredPrompt && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  💡 브라우저 우측 상단 <strong className="text-white">점 세 개(⋮)</strong> ➔ <strong className="text-white">[홈 화면에 추가]</strong> 또는 <strong className="text-white">[앱 설치]</strong>를 누르셔도 바로 설치됩니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 font-chivo font-bold animate-in fade-in">
            <Check size={16} className="text-emerald-400 shrink-0" />
            <span>바탕화면에 MAKS 단축아이콘이 성공적으로 생성되었습니다!</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 rounded-xl bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            다시 보지 않기
          </button>
          {!isIOS && (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing || success || isInstalled}
              className="flex-2 py-3 px-4 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-[0_4px_20px_rgba(245,194,0,0.35)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {installing ? (
                <span>설치 진행 중...</span>
              ) : isInstalled || success ? (
                <span>설치 완료 ✓</span>
              ) : (
                <>
                  <Download size={16} strokeWidth={2.5} />
                  <span>바탕화면에 MAKS 아이콘 만들기</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
