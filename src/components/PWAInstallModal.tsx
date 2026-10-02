import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Share, PlusSquare, Check, X, Sparkles } from 'lucide-react';
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
  const { deferredPrompt, isInstalled, isIOS, isMobile, triggerInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        const installed = await triggerInstall();
        if (installed) {
          setSuccess(true);
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
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
                <span>단축 아이콘 설치</span>
              </div>
              <h3 className="font-chivo font-black text-lg text-white">
                바탕화면에 MAKS 아이콘 추가
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed">
          PC와 스마트폰 바탕화면에 <strong className="text-[#f5c200] font-bold">MAKS</strong> 전용 아이콘을 만들어두면, 앱스토어 설치 없이 한 번의 터치로 바로 접속되며 새 공지가 올라왔을 때 아이콘에 읽지 않은 수량 뱃지가 자동으로 표시됩니다.
        </p>

        {/* Device-Specific Flow */}
        {isIOS ? (
          // iOS Safari instructions
          <div className="p-3.5 rounded-xl bg-[#11131a] border border-[#f5c200]/30 space-y-2.5 text-xs text-gray-300 font-chivo">
            <div className="flex items-center gap-2 text-white font-bold">
              <Smartphone size={16} className="text-[#f5c200]" />
              <span>아이폰(iOS Safari) 바탕화면 생성 방법</span>
            </div>
            <div className="flex items-start gap-2.5 pl-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f5c200] text-[#0f1118] text-[11px] font-black shrink-0 mt-0.5">
                1
              </span>
              <span>사파리 하단 중앙 <strong className="text-white inline-flex items-center gap-1">[공유 아이콘 <Share size={12} className="inline text-[#f5c200]" />]</strong> 터치</span>
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
              <span>우측 상단 <strong className="text-[#f5c200] font-bold">[추가]</strong>를 누르면 스마트폰 바탕화면에 <strong className="text-white font-bold">MAKS</strong> 아이콘이 생성됩니다!</span>
            </div>
          </div>
        ) : (
          // PC & Android direct install flow
          <div className="p-3.5 rounded-xl bg-[#11131a] border border-white/10 space-y-2.5 text-xs text-gray-300 font-chivo">
            <div className="flex items-center gap-2 text-white font-bold">
              {isMobile ? (
                <Smartphone size={16} className="text-[#f5c200]" />
              ) : (
                <Monitor size={16} className="text-[#f5c200]" />
              )}
              <span>{isMobile ? '모바일 바탕화면 바로가기' : 'PC 바탕화면 / 작업표시줄 바로가기'}</span>
            </div>
            <div className="space-y-1.5 text-gray-300 pl-1">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>웹 브라우저 주소창 없이 네이티브 앱처럼 전체화면 실행</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>새 공지 등록 시 아이콘에 <strong className="text-[#f5c200] font-bold">빨간 숫자 뱃지</strong> 자동 표시</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>PC 바탕화면과 스마트폰 홈 화면 어디서나 1초 즉시 실행</span>
              </div>
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
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            닫기
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
