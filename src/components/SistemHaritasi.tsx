import React from 'react';

interface Props {
  harita?: Record<string, string>;
  highlightPart?: string | null;
}

interface NodeDef {
  key: 'web' | 'api' | 'db' | 'sms';
  label: string;
  subLabel?: string;
  isDashed?: boolean;
}

const NODES: NodeDef[] = [
  { key: 'web', label: 'RANDEVU EKRANI' },
  { key: 'api', label: 'API' },
  { key: 'db', label: 'VERİTABANI' },
  { key: 'sms', label: 'SMS SERVİSİ', subLabel: 'ENTEGRASYON EKİBİ', isDashed: true },
];

export const SistemHaritasi: React.FC<Props> = ({ harita = {}, highlightPart }) => {
  return (
    <div
      data-testid="harita"
      className="w-full my-2.5 p-2 bg-[var(--fis)] border border-[var(--cizgi)] rounded-[4px] flex items-center justify-between gap-1 overflow-x-auto select-none min-h-[64px]"
    >
      {NODES.map((node, index) => {
        const durum = harita[node.key] || 'normal';
        const isHighlighted = highlightPart === node.key;

        // Border and status styling according to DESIGN.md §9
        let borderClass = 'border-[var(--cizgi)]';
        let statusBadge = null;

        if (durum === 'bozuk') {
          borderClass = 'border-[var(--pas)]';
          statusBadge = (
            <span className="font-mono-code text-[9px] font-bold text-[var(--pas)] uppercase">
              BOZUK
            </span>
          );
        } else if (durum === 'coktu') {
          borderClass = 'border-[var(--damga)]';
          statusBadge = (
            <span className="font-mono-code text-[9px] font-bold text-[var(--damga)] uppercase">
              ÇÖKTÜ
            </span>
          );
        } else if (durum === 'duzeldi') {
          borderClass = 'border-[var(--onay)]';
          statusBadge = (
            <span className="font-mono-code text-[9px] font-bold text-[var(--onay)] uppercase">
              DÜZELDİ
            </span>
          );
        }

        const dashedClass = node.isDashed ? 'border-dashed' : 'border-solid';
        const bgClass = isHighlighted ? 'bg-[var(--fosfor)]' : 'bg-[var(--kagit)]';

        return (
          <React.Fragment key={node.key}>
            <div
              data-testid={`harita-${node.key}`}
              data-durum={durum}
              className={`flex-1 min-w-[70px] border ${dashedClass} ${borderClass} ${bgClass} rounded-[2px] p-1.5 flex flex-col items-center justify-center text-center transition-colors duration-200`}
            >
              <span className="font-mono-code text-[11px] sm:text-[12px] font-semibold text-[var(--murekkep)] tracking-tight leading-tight">
                {node.label}
              </span>
              {node.subLabel && (
                <span className="font-mono-code text-[9px] text-[var(--soluk)] font-medium leading-none mt-0.5">
                  {node.subLabel}
                </span>
              )}
              {statusBadge && <div className="mt-0.5 leading-none">{statusBadge}</div>}
            </div>

            {index < NODES.length - 1 && (
              <span className="font-mono-code text-[13px] text-[var(--soluk)] px-0.5 shrink-0">
                →
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
