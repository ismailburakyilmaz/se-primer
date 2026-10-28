import React, { useState } from 'react';
import { RubberStamp } from './RubberStamp.js';

interface Message {
  role: 'user' | 'tutor';
  text: string;
  isFallback?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (msg: string) => Promise<{ answer: string; isFallback: boolean; error?: string }>;
  hazirIpucu: string;
}

export const TutorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSendMessage,
  hazirIpucu,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await onSendMessage(trimmed);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div
        data-testid="panel-tutor"
        className="w-full sm:max-w-lg bg-[var(--fis)] border border-[var(--cizgi)] rounded-t-[4px] sm:rounded-[4px] p-4 text-[var(--murekkep)] flex flex-col max-h-[85vh] h-[550px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--cizgi)] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-[12px] font-semibold text-[var(--soluk)] uppercase tracking-wider">
              TUTORA SOR · REHBERLİK
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--soluk)] hover:text-[var(--murekkep)] text-[16px] px-1 font-mono-code cursor-pointer"
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

          {messages.map((m, idx) => (
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
                      <span className="text-[11px] text-[var(--pas)] font-mono-code">
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
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-2 text-[12px] text-[var(--soluk)] font-mono-code">
              <span className="animate-pulse">●</span> Tutor düşünüyor...
            </div>
          )}
        </div>

        <div className="tear-line my-2" />

        {/* Input bar */}
        <div className="flex gap-2 pt-1">
          <input
            data-testid="tutor-girdi"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sorunu veya düşünceni yaz..."
            className="flex-1 bg-[var(--kagit)] border border-[var(--cizgi)] rounded-[4px] px-3 py-2 text-[14px] text-[var(--murekkep)] focus:outline-none focus:border-[var(--tukenmez)]"
            disabled={isLoading}
          />
          <button
            data-testid="tutor-gonder"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="h-10 px-4 bg-[var(--tukenmez)] text-white font-medium rounded-[4px] text-[13px] disabled:opacity-50 cursor-pointer"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
