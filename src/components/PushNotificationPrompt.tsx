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

        {/* Feature Checkpoints */}
        <div className="p-3 rounded-xl bg-[#11131a] border border-white/10 space-y-2 text-xs text-gray-300 font-chivo">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>브라우저 팝업에서 <strong className="text-white">"허용"</strong>을 누르면 즉시 연동</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>앱을 닫고 있어도 새 공지 등록 시 배너 자동 알림</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>비즈니스 인증 없이 회원 가입 즉시 무료 제공</span>
          </div>
        </div>

        {/* Error message / OS Specific Help */}
        {status === 'error' && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>

            {/* In-App / KakaoTalk Guide */}
            {errorMessage.includes('카카오톡') && (
              <div className="p-2.5 rounded-lg bg-[#0c0e15] border border-white/10 text-[11px] text-gray-300 space-y-1">
                <div className="font-bold text-[#f5c200]">💡 카카오톡/인앱에서 외부 브라우저로 여는 법</div>
                <div>화면 우측 하단 <strong className="text-white">점 세개(⋮)</strong> 또는 공유 버튼 ➔ <strong className="text-white">[기본 브라우저로 열기]</strong> (크롬/사파리)를 누르시면 푸시 알림이 즉시 활성화됩니다.</div>
              </div>
            )}

            {/* iOS Safari Guide */}
            {errorMessage.includes('아이폰') && (
              <div className="p-2.5 rounded-lg bg-[#0c0e15] border border-white/10 text-[11px] text-gray-300 space-y-1">
                <div className="font-bold text-[#f5c200]">📱 아이폰(iOS Safari) 푸시 알림 허용 방법</div>
                <div>1. Safari 하단 중앙 <strong className="text-white">[공유 아이콘(↑)]</strong> 터치</div>
                <div>2. 메뉴를 내려 <strong className="text-white">[홈 화면에 추가]</strong> 터치</div>
                <div>3. 홈 화면에 생성된 <strong className="text-[#f5c200]">MAKS 스쿼시 앱</strong> 아이콘을 열면 푸시 알림이 정상 작동합니다.</div>
              </div>
            )}
          </div>
        )}

        {/* Success message */}
        {status === 'success' && (
          <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-chivo font-bold">
            <Check size={15} className="shrink-0" />
            <span>푸시 알림 구독이 완료되었습니다! (테스트 알림 발송됨)</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-[#11131a] hover:bg-[#1a1c24] border border-white/10 text-xs font-chivo font-bold text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            다음에 하기
          </button>
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={loading || status === 'success'}
            className="flex-2 py-3 px-4 rounded-xl bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-sm shadow-[0_4px_16px_rgba(245,194,0,0.3)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>권한 확인 중...</span>
            ) : status === 'success' ? (
              <span>연동 완료 ✓</span>
            ) : (
              <>
                <Bell size={16} />
                <span>알림 허용 및 연동하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
