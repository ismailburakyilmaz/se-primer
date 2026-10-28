import React from 'react';
import { GLOSSARY } from '../utils/engine.js';
import { Terim } from '../types/game.js';

interface Props {
  text: string;
  onSelectTerm: (term: Terim) => void;
  className?: string;
}

export const HighlightedText: React.FC<Props> = ({ text, onSelectTerm, className = '' }) => {
  if (!text) return null;

  // Build matchers sorted by length descending so longer phrases match first
  const matchers: { phrase: string; term: Terim }[] = [];
  for (const term of GLOSSARY) {
    for (const phrase of term.eslesme) {
      matchers.push({ phrase, term });
    }
  }
  matchers.sort((a, b) => b.phrase.length - a.phrase.length);

  // Find occurrences
  type Segment = { isMatch: boolean; text: string; term?: Terim };
  let segments: Segment[] = [{ isMatch: false, text }];

  for (const { phrase, term } of matchers) {
    const nextSegments: Segment[] = [];
    const lowerPhrase = phrase.toLowerCase();

    for (const seg of segments) {
      if (seg.isMatch) {
        nextSegments.push(seg);
        continue;
      }

      let remaining = seg.text;
      let lowerRemaining = remaining.toLowerCase();
      let idx = lowerRemaining.indexOf(lowerPhrase);

      while (idx !== -1) {
        // Check word boundaries roughly so we don't break in middle of letters unless appropriate
        const before = remaining.slice(0, idx);
        const matched = remaining.slice(idx, idx + phrase.length);
        remaining = remaining.slice(idx + phrase.length);
        lowerRemaining = remaining.toLowerCase();

        if (before) nextSegments.push({ isMatch: false, text: before });
        nextSegments.push({ isMatch: true, text: matched, term });
        idx = lowerRemaining.indexOf(lowerPhrase);
      }

      if (remaining) {
        nextSegments.push({ isMatch: false, text: remaining });
      }
    }
    segments = nextSegments;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.isMatch || !seg.term) {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        }

        return (
          <button
            key={i}
            type="button"
            data-testid={`terim-${seg.term.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTerm(seg.term!);
            }}
            className="cursor-pointer border-b border-dotted border-[var(--murekkep)] hover:bg-[var(--fosfor)] text-[var(--murekkep)] p-0 m-0 font-inherit inline text-left focus:outline-none focus:ring-1 focus:ring-[var(--tukenmez)]"
            title={`${seg.term.terim}: Tanımı gör`}
          >
            {seg.text}
          </button>
        );
      })}
    </span>
  );
};
