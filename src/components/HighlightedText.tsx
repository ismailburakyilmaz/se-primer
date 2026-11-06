import React from 'react';
import { GLOSSARY, SCENARIO } from '../utils/engine.js';
import { Terim } from '../types/game.js';

interface Props {
  text: string;
  onSelectTerm?: (term: Terim) => void;
  onSearchExpression?: (expression: string) => void;
  className?: string;
  highlightQuery?: string;
  disableSearchable?: boolean;
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

interface RangeMatch {
  start: number;
  end: number;
  type: 'term' | 'searchable' | 'highlight';
  term?: Terim;
  searchExpr?: string;
}

export const HighlightedText: React.FC<Props> = ({
  text,
  onSelectTerm,
  onSearchExpression,
  className = '',
  highlightQuery = '',
  disableSearchable = false,
}) => {
  if (!text) return null;

  const normText = normalizeTr(text);
  const ranges: RangeMatch[] = [];

  const isOverlapping = (start: number, end: number) => {
    return ranges.some((r) => Math.max(r.start, start) < Math.min(r.end, end));
  };

  // 1. Glossary Terms (priority 1)
  if (onSelectTerm && GLOSSARY && GLOSSARY.length > 0) {
    const termMatchers: { phrase: string; term: Terim }[] = [];
    for (const term of GLOSSARY) {
      for (const phrase of term.eslesme) {
        termMatchers.push({ phrase, term });
      }
    }
    // Longer phrases match first
    termMatchers.sort((a, b) => b.phrase.length - a.phrase.length);

    for (const { phrase, term } of termMatchers) {
      const normPhrase = normalizeTr(phrase);
      let pos = normText.indexOf(normPhrase);
      while (pos !== -1) {
        const end = pos + normPhrase.length;
        if (!isOverlapping(pos, end)) {
          ranges.push({ start: pos, end, type: 'term', term });
        }
        pos = normText.indexOf(normPhrase, pos + 1);
      }
    }
  }

  // 2. Searchable Expressions (priority 2, if not overlapping term)
  if (onSearchExpression && !disableSearchable) {
    const searchList: string[] = (SCENARIO as any).aranabilir_ifadeler || [];
    const sortedSearchList = [...searchList].sort((a, b) => b.length - a.length);

    for (const expr of sortedSearchList) {
      const normExpr = normalizeTr(expr);
      let pos = normText.indexOf(normExpr);
      while (pos !== -1) {
        const end = pos + normExpr.length;
        if (!isOverlapping(pos, end)) {
          ranges.push({ start: pos, end, type: 'searchable', searchExpr: expr });
        }
        pos = normText.indexOf(normExpr, pos + 1);
      }
    }
  }

  // 3. Highlight Query (priority 3, e.g. in search results)
  if (highlightQuery && highlightQuery.trim().length >= 2) {
    const normHighlight = normalizeTr(highlightQuery.trim());
    let pos = normText.indexOf(normHighlight);
    while (pos !== -1) {
      const end = pos + normHighlight.length;
      if (!isOverlapping(pos, end)) {
        ranges.push({ start: pos, end, type: 'highlight' });
      }
      pos = normText.indexOf(normHighlight, pos + 1);
    }
  }

  // Sort ranges by start position
  ranges.sort((a, b) => a.start - b.start);

  interface Segment {
    type: 'text' | 'term' | 'searchable' | 'highlight';
    text: string;
    term?: Terim;
    searchExpr?: string;
  }

  const segments: Segment[] = [];
  let currentIndex = 0;

  for (const r of ranges) {
    if (r.start > currentIndex) {
      segments.push({
        type: 'text',
        text: text.slice(currentIndex, r.start),
      });
    }
    segments.push({
      type: r.type,
      text: text.slice(r.start, r.end),
      term: r.term,
      searchExpr: r.searchExpr,
    });
    currentIndex = r.end;
  }

  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(currentIndex),
    });
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'term' && seg.term) {
          return (
            <button
              key={i}
              type="button"
              data-testid={`terim-${seg.term.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTerm?.(seg.term!);
              }}
              className="cursor-pointer border-b border-dotted border-[var(--murekkep)] hover:bg-[var(--fosfor)] text-[var(--murekkep)] p-0 m-0 font-inherit inline text-left focus:outline-none focus:ring-1 focus:ring-[var(--tukenmez)]"
              title={`${seg.term.terim}: Tanımı gör`}
            >
              {seg.text}
            </button>
          );
        }

        if (seg.type === 'searchable' && seg.searchExpr) {
          return (
            <button
              key={i}
              type="button"
              data-testid={`aranabilir-${seg.searchExpr}`}
              onClick={(e) => {
                e.stopPropagation();
                onSearchExpression?.(seg.searchExpr!);
              }}
              className="cursor-pointer font-mono-code text-[var(--murekkep)] border-b border-solid border-[var(--murekkep)] hover:bg-[var(--fosfor)] inline-flex items-center min-h-[44px] py-1 px-0.5 m-0 text-left focus:outline-none"
              title={`"${seg.searchExpr}" ifadesini log konsolunda ara`}
            >
              {seg.text}
            </button>
          );
        }

        if (seg.type === 'highlight') {
          return (
            <mark
              key={i}
              className="bg-[var(--fosfor)] text-[var(--murekkep)] px-0.5 rounded-[1px]"
            >
              {seg.text}
            </mark>
          );
        }

        return <React.Fragment key={i}>{seg.text}</React.Fragment>;
      })}
    </span>
  );
};
