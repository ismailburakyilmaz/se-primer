import React, { useState, useEffect, useMemo } from 'react';
import { LogSatiri, Rol, Seviye } from '../types/game.js';
import { RubberStamp } from './RubberStamp.js';
import { HighlightedText } from './HighlightedText.js';

interface Props {
  allLogs: LogSatiri[];
  currentSceneSuggestions?: string[];
  rol: Rol;
  seviye: Seviye;
  markedLogIds: string[];
  initialQuery?: string;
  onMarkLog: (log: LogSatiri) => void;
  onSearchRecorded?: (term: string) => void;
  onClose: () => void;
}

function normalizeTr(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function parseChronologicalSeconds(saat: string): number {
  const parts = saat.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  // Hours 20-23 are yesterday night (Day 0), 00-19 are today morning (Day 1)
  const dayOffset = h >= 20 ? 0 : 24 * 3600;
  return dayOffset + h * 3600 + m * 60 + s;
}

export const LogConsoleModal: React.FC<Props> = ({
  allLogs,
  currentSceneSuggestions = [],
  rol,
  markedLogIds,
  initialQuery = '',
  onMarkLog,
  onSearchRecorded,
  onClose,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const normalizedQuery = normalizeTr(query.trim());

  // 600 ms debounce to record search query (spec §13.2 / Requirement F.5 / Item 5)
  useEffect(() => {
    if (normalizedQuery.length < 2) return;
    const timer = setTimeout(() => {
      if (onSearchRecorded) {
        onSearchRecorded(normalizedQuery);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [normalizedQuery, onSearchRecorded]);

  // Canlı akış: Arama kutusu boşken o ana kadar açılmış logların en yeni 10 tanesi (en yenisi en üstte)
  const liveFeedLogs = useMemo(() => {
    const sorted = [...allLogs].sort(
      (a, b) => parseChronologicalSeconds(b.saat) - parseChronologicalSeconds(a.saat)
    );
    return sorted.slice(0, 10);
  }, [allLogs]);

  // Arama sonuçları: >= 2 karakter yazılınca
  const matchedLogs = useMemo(() => {
    if (normalizedQuery.length < 2) return [];

    const matched = allLogs.filter((log) => {
      const text = rol === 'backend' ? log.metin_backend : log.metin_lider;
      return normalizeTr(text).includes(normalizedQuery);
    });

    // Chronological order: ascending
    return matched.sort(
      (a, b) => parseChronologicalSeconds(a.saat) - parseChronologicalSeconds(b.saat)
    );
  }, [allLogs, normalizedQuery, rol]);

  const displayedLogs = matchedLogs.slice(0, 8);
  const hasMore = matchedLogs.length > 8;

  const handleSearchFromInnerExpr = (expr: string) => {
    setQuery(expr);
    if (onSearchRecorded) {
      onSearchRecorded(normalizeTr(expr.trim()));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        data-testid="panel-konsol"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-4 sm:p-5 flex flex-col max-h-[85vh] shadow-none"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              LOG KONSOLU · LOG DÖKÜMÜ
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-[var(--soluk)] hover:text-[var(--murekkep)] cursor-pointer text-[18px] focus:outline-none"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Olay Yönetmeni Destek modu: ekipten öneri (spec §12.1, §13.5) */}
        {currentSceneSuggestions.length > 0 && (
          <div className="mb-3">
            <div className="font-mono-code text-[12px] font-semibold text-[var(--onay)] uppercase tracking-wider mb-1">
              EKİPTEN ÖNERİ
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSceneSuggestions.map((kelime, i) => (
                <button
                  key={kelime}
                  type="button"
                  data-testid={`konsol-oneri-${i}`}
                  onClick={() => setQuery(kelime)}
                  className="px-2.5 py-1.5 min-h-[36px] font-mono-code text-[12px] text-[var(--murekkep)] bg-[var(--kagit)] border border-dashed border-[var(--cizgi)] rounded-[2px] cursor-pointer hover:border-[var(--murekkep)]"
                >
                  {kelime}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search input area */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <label
              htmlFor="konsol-input"
              className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider"
            >
              LOGDA ARA
            </label>
            {normalizedQuery.length >= 2 && (
              <span className="font-mono-code text-[12px] text-[var(--soluk)]">
                {matchedLogs.length} satır
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="konsol-input"
              data-testid="konsol-arama"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="En az 2 harf yazın…"
              autoFocus
              className="w-full px-3 py-2 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[2px] font-mono-code text-[13px] text-[var(--murekkep)] focus:outline-none focus:border-[var(--tukenmez)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--soluk)] hover:text-[var(--murekkep)] text-[12px] px-2 py-1 cursor-pointer font-mono-code"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Continuous printer paper results area */}
        <div className="flex-1 overflow-y-auto border border-[var(--cizgi)] rounded-[2px] bg-[var(--fis)] min-h-[160px] p-2 relative">
          {query.trim() === '' ? (
            <div>
              <div
                data-testid="konsol-akis"
                className="font-mono-code text-[12px] text-[var(--soluk)] font-semibold uppercase tracking-wider mb-2 px-1"
              >
                CANLI AKIŞ · SON 10 SATIR
              </div>
              <div className="divide-y divide-[var(--cizgi)]">
                {liveFeedLogs.map((log, idx) => {
                  const text = rol === 'backend' ? log.metin_backend : log.metin_lider;
                  const isMarked = markedLogIds.includes(log.id);

                  return (
                    <div
                      key={log.id}
                      data-testid={`konsol-satir-${log.id}`}
                      className={`p-2.5 flex items-start justify-between gap-3 animate-satir-dus ${
                        idx % 2 === 1 ? 'bg-[var(--kagit)]' : 'bg-[var(--fis)]'
                      }`}
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="flex-1 font-mono-code text-[13px] leading-relaxed text-[var(--murekkep)]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[var(--soluk)] text-[12px]">
                            {log.saat}
                          </span>
                          <span className="text-[var(--soluk)] text-[12px] uppercase font-semibold">
                            {log.kaynak}
                          </span>
                          {isMarked && (
                            <RubberStamp text="BULUNDU" type="BULUNDU" bas={true} />
                          )}
                        </div>
                        <div className="break-words">
                          <HighlightedText
                            text={text}
                            onSearchExpression={handleSearchFromInnerExpr}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isMarked ? (
                          <span className="font-mono-code text-[12px] text-[var(--onay)] font-semibold px-2 py-1">
                            İşaretlendi
                          </span>
                        ) : (
                          <button
                            type="button"
                            data-testid={`konsol-isaretle-${log.id}`}
                            onClick={() => onMarkLog(log)}
                            className="font-mono-code text-[12px] font-semibold text-[var(--murekkep)] px-2.5 py-1.5 border border-[var(--murekkep)] bg-[var(--fis)] hover:bg-[var(--kagit)] rounded-[2px] cursor-pointer"
                          >
                            İşaretle
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : normalizedQuery.length < 2 ? (
            <div className="flex items-center justify-center h-32 text-center p-4">
              <span className="font-mono-code text-[12px] text-[var(--soluk)]">
                Aramak istediğiniz ifadeyi girin (en az 2 karakter).
              </span>
            </div>
          ) : matchedLogs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-center p-4">
              <span className="font-mono-code text-[12px] text-[var(--soluk)]">
                Eşleşen log satırı bulunamadı.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-[var(--cizgi)]">
              {displayedLogs.map((log, idx) => {
                const text = rol === 'backend' ? log.metin_backend : log.metin_lider;
                const isMarked = markedLogIds.includes(log.id);

                return (
                  <div
                    key={log.id}
                    data-testid={`konsol-satir-${log.id}`}
                    className={`p-2.5 flex items-start justify-between gap-3 ${
                      idx % 2 === 1 ? 'bg-[var(--kagit)]' : 'bg-[var(--fis)]'
                    }`}
                  >
                    <div className="flex-1 font-mono-code text-[13px] leading-relaxed text-[var(--murekkep)]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--soluk)] text-[12px]">
                          {log.saat}
                        </span>
                        <span className="text-[var(--soluk)] text-[12px] uppercase font-semibold">
                          {log.kaynak}
                        </span>
                        {isMarked && (
                          <RubberStamp text="BULUNDU" type="BULUNDU" bas={true} />
                        )}
                      </div>
                      <div className="break-words">
                        <HighlightedText
                          text={text}
                          highlightQuery={query}
                          onSearchExpression={handleSearchFromInnerExpr}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isMarked ? (
                        <span className="font-mono-code text-[12px] text-[var(--onay)] font-semibold px-2 py-1">
                          İşaretlendi
                        </span>
                      ) : (
                        <button
                          type="button"
                          data-testid={`konsol-isaretle-${log.id}`}
                          onClick={() => onMarkLog(log)}
                          className="font-mono-code text-[12px] font-semibold text-[var(--murekkep)] px-2.5 py-1.5 border border-[var(--murekkep)] bg-[var(--fis)] hover:bg-[var(--kagit)] rounded-[2px] cursor-pointer"
                        >
                          İşaretle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div className="p-3 text-center bg-[var(--kagit)]">
                  <span className="font-mono-code text-[12px] font-semibold text-[var(--pas)]">
                    Aramayı daralt (8'den fazla sonuç var)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[var(--cizgi)] flex items-center justify-between">
          <span className="font-mono-code text-[12px] text-[var(--soluk)]">
            {rol === 'backend' ? 'Sunucu logları taranıyor' : 'Ekip kanalı arşivi taranıyor'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-mono-code text-[var(--murekkep)] border border-[var(--cizgi)] bg-[var(--fis)] hover:bg-[var(--kagit)] rounded-[2px] cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
