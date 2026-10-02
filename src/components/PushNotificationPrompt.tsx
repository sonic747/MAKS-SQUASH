import React, { useState } from 'react';
import { Bell, BellRing, Check, ShieldCheck, Smartphone, X, AlertCircle } from 'lucide-react';
import { SquashMember } from '../types';
import { requestPushPermissionAndGetToken, displayLocalPushNotification } from '../firebase';

interface PushNotificationPromptProps {
  currentUser?: SquashMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: (token: string) => void;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSubscribed,
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const result = await requestPushPermissionAndGetToken(
        currentUser?.id || 'guest',
        currentUser?.name || '방문자',
        currentUser?.role || 'member'
      );

      if (result.success && result.token) {
        setStatus('success');

        // Also register with server
        try {
          await fetch('/api/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: result.token,
              memberId: currentUser?.id,
              memberName: currentUser?.name,
              role: currentUser?.role,
            }),
          });
        } catch (e) {
          console.warn('Server push register sync non-critical:', e);
        }

        // Show immediate test notification to confirm
        displayLocalPushNotification('⚡ [MAKS SQUASH] 푸시 알림 구독 완료!', {
          body: `${currentUser?.name || '회원'}님, 앞으로 클럽 새 공지와 경기 결과가 즉시 배너 알림으로 전송됩니다.`,
        });

        if (onSubscribed) {
          onSubscribed(result.token);
        }

        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setStatus('error');
        setErrorMessage(result.error || '알림 권한을 획득하지 못했습니다.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || '알림 설정 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#161822] border border-[#f5c200]/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#f5c200]/15 border border-[#f5c200]/30 flex items-center justify-center text-[#f5c200] shadow-[0_0_20px_rgba(245,194,0,0.2)]">
            <BellRing size={24} className="animate-pulse" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f5c200]/20 text-[#f5c200] text-[10px] font-chivo font-black tracking-wider uppercase">
            <span>⭐ 구글 FCM 기반 100% 무료 웹 푸시</span>
          </div>
          <h3 className="font-chivo font-black text-lg text-white">
            클럽 실시간 공지 푸시 알림 받기
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            새로운 클럽 공지사항, 대회 일정 및 경기 결과가 등록되면 스마트폰과 PC 화면 상단에 카카오톡처럼 즉시 배너 알림이 도착합니다.
          </p>
        </div>

        {/* 1-Tap Subscription Box */}
        <div className="p-3.5 rounded-xl bg-[#11131a] border border-[#f5c200]/30 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-white font-bold font-chivo">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f5c200] text-[#0f1118] text-xs font-black shrink-0">
              1
            </span>
            <span>아래 노란색 [원클릭 알림 켜기] 버튼을 누르세요.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-300 font-chivo">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white text-xs font-bold shrink-0">
              2
            </span>
            <span>브라우저 팝업이 뜨면 <strong className="text-[#f5c200] font-bold">"허용"</strong>만 누르면 즉시 완료!</span>
          </div>
        </div>

        {/* Success message */}
        {status === 'success' && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 font-chivo font-bold animate-in fade-in">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-[#0f1118] flex items-center justify-center shrink-0">
              <Check size={16} strokeWidth={3} />
            </div>
            <span>푸시 알림이 정상적으로 켜졌습니다! (테스트 알림 발송됨)</span>
          </div>
        )}

        {/* Guidance / Error message */}
        {status === 'error' && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>

            {/* Quick helper for KakaoTalk */}
            {errorMessage.includes('카카오톡') && (
              <div className="p-2.5 rounded-lg bg-[#0c0e15] border border-white/10 text-[11px] text-gray-300">
                👉 우측 하단 <strong className="text-white">점 세개(⋮)</strong> ➔ <strong className="text-[#f5c200]">[다른 브라우저로 열기]</strong>를 누르시면 1초 만에 알림이 켜집니다!
              </div>
            )}
          </div>
        )}

        {/* Actions: Big, clear 1-click button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={loading || status === 'success'}
            className="w-full py-3.5 px-4 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-[0_4px_20px_rgba(245,194,0,0.35)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>연동 처리 중...</span>
            ) : status === 'success' ? (
              <span>연동 완료 ✓</span>
            ) : (
              <>
                <Bell size={18} strokeWidth={2.5} />
                <span>원클릭 푸시 알림 켜기 (무료)</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-transparent hover:bg-white/5 text-xs font-chivo font-medium text-gray-400 hover:text-white cursor-pointer transition-colors text-center"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
};
