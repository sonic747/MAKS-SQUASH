import React, { useRef } from 'react';
import {
  HardDrive,
  FileDown,
  FileUp,
  Database,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SquashMember } from '../types';

interface BackupViewProps {
  members: SquashMember[];
  maxCapacity: number;
  onDownloadJson: () => void;
  onImportJson: (jsonData: string) => boolean;
}

export const BackupView: React.FC<BackupViewProps> = ({
  members,
  maxCapacity,
  onDownloadJson,
  onImportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const success = onImportJson(reader.result);
          if (success) {
            alert('데이터 파일 복원이 성공적으로 완료되었습니다.');
          } else {
            alert('올바른 백업 파일 형식이 아닙니다.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 pb-24">
      {/* Top Protocol Card */}
      <div className="rounded-xl bg-[#161822] border border-white/[0.08] p-4 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-chivo font-black tracking-wider text-[#f5c200]">
            <Database size={16} />
            <span>DATA BACKUP & RESTORE</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e222d] border border-white/10 text-[10px] font-chivo font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>정상 보관 중</span>
          </div>
        </div>

        <h2 className="font-chivo font-extrabold text-lg sm:text-xl text-white tracking-tight">
          클럽 데이터 백업 및 복원
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          현재 등록된 회원 명부와 피드 게시글을 JSON 파일로 안전하게 백업 및 복원합니다.
        </p>

        {/* Status Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.08]">
          <div className="p-2.5 rounded-lg bg-[#11131a] border border-white/5">
            <span className="text-[10px] text-gray-400 block font-chivo">보관 중인 회원 데이터</span>
            <span className="font-chivo font-black text-sm text-white">
              {members.length} <span className="text-xs text-gray-400">/ {maxCapacity}명</span>
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#11131a] border border-white/5">
            <span className="text-[10px] text-gray-400 block font-chivo">보관 형식</span>
            <span className="font-chivo font-bold text-xs text-emerald-400">
              JSON 독립 데이터
            </span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export / Download */}
        <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] flex flex-col justify-between space-y-3 shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f5c200]/10 border border-[#f5c200]/30 flex items-center justify-center text-[#f5c200] mb-2">
              <FileDown size={22} />
            </div>
            <h3 className="font-chivo font-black text-white text-sm">
              데이터 백업 파일 다운로드
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              현재 클럽 명부와 피드 활동 내역을 <strong>maks_members.json</strong> 파일로 로컬 기기에 즉시 저장합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onDownloadJson}
            className="w-full py-2.5 px-3 rounded-lg bg-[#f5c200] hover:bg-[#ffe299] text-[#0f1118] font-chivo font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
          >
            <FileDown size={14} />
            <span>백업 파일 (.json) 다운로드</span>
          </button>
        </div>

        {/* Import / Upload */}
        <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] flex flex-col justify-between space-y-3 shadow-lg">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
              <FileUp size={22} />
            </div>
            <h3 className="font-chivo font-black text-white text-sm">
              백업 파일로부터 데이터 복원
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              이전에 내려받은 <strong>.json</strong> 파일을 선택하면 클럽 회원 명부와 피드 데이터를 즉시 복구합니다.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-lg bg-[#1e222d] hover:bg-[#282d3c] border border-white/10 text-white font-chivo font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <FileUp size={14} />
              <span>백업 파일 선택 및 복원</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Info */}
      <div className="p-4 rounded-xl bg-[#161822] border border-white/[0.08] space-y-2 text-xs">
        <div className="font-chivo font-bold text-gray-300 flex items-center gap-1.5">
          <HardDrive size={14} className="text-[#f5c200]" />
          <span>백업 관리 사용 안내</span>
        </div>
        <ul className="space-y-1.5 text-[11px] text-gray-400 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-gray-200">[파일 다운로드]</strong>를 누르면 현재 등록된 모든 회원 목록과 피드 내역이 담긴 백업 파일이 기기에 저장됩니다.
          </li>
          <li>
            스마트폰을 교체하거나 다른 브라우저에서 사용할 때 <strong className="text-gray-200">[데이터 복원]</strong>을 통해 백업 파일을 선택하면 즉시 원래 상태로 복구됩니다.
          </li>
        </ul>
      </div>
    </div>
  );
};
