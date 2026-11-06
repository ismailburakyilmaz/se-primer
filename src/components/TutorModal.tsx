import React, { useState, useEffect } from 'react';
import { RubberStamp } from './RubberStamp.js';

interface Message {
  role: 'user' | 'tutor' | 'separator';
  text: string;
  isFallback?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (
    msg: string,
    isAfterIsrar: boolean,
    resetHistory: boolean
  ) => Promise<{ answer: string; isFallback: boolean; error?: string }>;
  hazirIpucu: string;
  israrKaliplari?: string[];
  sceneResetKey?: string;
  onTutorMessageSent?: (isIsrar: boolean) => void;
}

export const TutorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSendMessage,
  hazirIpucu,
  israrKaliplari = [],
  sceneResetKey = '',
  onTutorMessageSent,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sceneIsrarCount, setSceneIsrarCount] = useState<number>(0);

  // Reset scene israr counter when scene changes
  useEffect(() => {
    setSceneIsrarCount(0);
    setMessages([]);
  }, [sceneResetKey]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Check if input matches any israr pattern
    const lower = trimmed.toLocaleLowerCase('tr-TR');
    const isIsrar = israrKaliplari.some((kalip) =>
      lower.includes(kalip.toLocaleLowerCase('tr-TR'))
    );

    const nextIsrarCount = isIsrar ? sceneIsrarCount + 1 : sceneIsrarCount;
    if (isIsrar) {
      setSceneIsrarCount(nextIsrarCount);
    }

    if (onTutorMessageSent) {
      onTutorMessageSent(isIsrar);
    }

    const resetHistory = isIsrar && nextIsrarCount >= 2;

    // If second israr triggered, insert separator and reset chat
    let newHistory: Message[] = messages;
    if (resetHistory) {
      newHistory = [
        { role: 'separator', text: '— AYNI KANITA DÖNELİM —' },
      ];
    }

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages([...newHistory, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await onSendMessage(trimmed, isIsrar, resetHistory);
      setMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: res.answer,
          isFallback: res.isFallback,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: hazirIpucu,
          isFallback: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        data-testid="panel-tutor"
        className="w-full sm:max-w-lg bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-4 text-[var(--murekkep)] flex flex-col max-h-[85vh] h-[580px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              TUTORA SOR · REHBERLİK
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--soluk)] hover:text-[var(--murekkep)] text-[16px] font-mono-code cursor-pointer -mr-2 -my-2"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {messages.length === 0 && (
            <div className="p-3 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px] text-[13px] text-[var(--soluk)]">
              Kriz anında aklına takılan terimleri veya kararın öncesindeki soru işaretlerini sorabilirsin. Tutor doğrudan doğru seçeneği söylemez, kanıtlar üzerinden düşünmene yardım eder.
            </div>
          )}

          {messages.map((m, idx) => {
            if (m.role === 'separator') {
              return (
                <div
                  key={idx}
                  data-testid="tutor-israr"
                  className="text-center font-mono-code text-[12px] font-bold text-[var(--soluk)] py-2 select-none tracking-wider"
                >
                  {m.text}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[80%] bg-[var(--tukenmez)] text-white text-[14px] px-3 py-2 rounded-[4px] leading-relaxed">
                    {m.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-[var(--kagit)] border border-[var(--cizgi)] text-[14px] px-3 py-2.5 rounded-[4px] leading-relaxed text-[var(--murekkep)]">
                    {m.isFallback && (
                      <div className="mb-2 pb-1 border-b border-[var(--cizgi)] flex items-center justify-between gap-2">
                        <span className="text-[12px] text-[var(--pas)] font-mono-code">
                          Tutor şu an kullanılamıyor
                        </span>
                        <RubberStamp
                          text="HAZIR İPUCU"
                          testId="etiket-hazir-ipucu"
                        />
                      </div>
                    )}
                    <div data-testid="tutor-cevap">
                      {m.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-2 text-[12px] text-[var(--soluk)] font-mono-code">
              <span className="animate-pulse">●</span> Tutor düşünüyor...
            </div>
          )}
        </div>

        {/* Hazır Soru Düğmeleri (spec §6.2, Requirement E.1) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-2 border-t border-[var(--cizgi)] mb-2">
          <button
            type="button"
            data-testid="tutor-hazir-0"
            onClick={() => handleSendText('Bu kanıt ne anlama geliyor?')}
            disabled={isLoading}
            className="min-h-[44px] px-2 py-1 bg-[var(--kagit)] hover:bg-[var(--fis)] border border-[var(--cizgi)] text-[var(--murekkep)] font-mono-code text-[12px] rounded-[2px] cursor-pointer text-center flex items-center justify-center leading-tight disabled:opacity-50"
          >
            Bu kanıt ne anlama geliyor?
          </button>
          <button
            type="button"
            data-testid="tutor-hazir-1"
            onClick={() => handleSendText('Neyi gözden kaçırıyor olabilirim?')}
            disabled={isLoading}
            className="min-h-[44px] px-2 py-1 bg-[var(--kagit)] hover:bg-[var(--fis)] border border-[var(--cizgi)] text-[var(--murekkep)] font-mono-code text-[12px] rounded-[2px] cursor-pointer text-center flex items-center justify-center leading-tight disabled:opacity-50"
          >
            Neyi gözden kaçırıyor olabilirim?
          </button>
          <button
            type="button"
            data-testid="tutor-hazir-2"
            onClick={() => handleSendText('Bu terim ne?')}
            disabled={isLoading}
            className="min-h-[44px] px-2 py-1 bg-[var(--kagit)] hover:bg-[var(--fis)] border border-[var(--cizgi)] text-[var(--murekkep)] font-mono-code text-[12px] rounded-[2px] cursor-pointer text-center flex items-center justify-center leading-tight disabled:opacity-50"
          >
            Bu terim ne?
          </button>
        </div>

        {/* Input bar - at least 44px height */}
        <div className="flex gap-2 pt-1">
          <input
            data-testid="tutor-girdi"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText(inputText)}
            placeholder="Sorunu veya düşünceni yaz..."
            className="flex-1 min-h-[44px] h-[44px] bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px] px-3 py-2 text-[14px] text-[var(--murekkep)] focus:outline-none focus:border-[var(--tukenmez)]"
            disabled={isLoading}
          />
          <button
            type="button"
            data-testid="tutor-gonder"
            onClick={() => handleSendText(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="min-h-[44px] h-[44px] px-4 bg-[var(--tukenmez)] text-white font-medium rounded-[4px] text-[13px] disabled:opacity-50 cursor-pointer"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
