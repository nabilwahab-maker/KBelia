import React from 'react';
import { middleTruncate, splitAcronymTokens, toCurlyQuotes } from '../utils/typographyUtils';

interface MiddleTruncateProps {
  text: string;
  startChars?: number;
  endChars?: number;
  className?: string;
}

/**
 * Renders long reference codes, SSM registration numbers, or filenames with
 * middle truncation so both the prefix and unique ending remain legible,
 * while keeping the full raw string available via tooltip.
 */
export const MiddleTruncate: React.FC<MiddleTruncateProps> = ({
  text,
  startChars = 10,
  endChars = 6,
  className = ''
}) => {
  const shortened = middleTruncate(text, startChars, endChars);
  return (
    <span
      title={text}
      className={`font-mono tabular-nums whitespace-nowrap inline-block align-baseline ${className}`}
    >
      {shortened}
    </span>
  );
};

interface AcronymTextProps {
  text: string;
  className?: string;
}

/**
 * Formats visible prose with typographic curly quotes and renders recognized
 * official acronyms (SSM, MARA, TEKUN, B2B, F&B, PDF, QR, etc.) in subtle small caps.
 */
export const AcronymText: React.FC<AcronymTextProps> = ({ text, className = '' }) => {
  const tokens = splitAcronymTokens(text);
  return (
    <span className={className}>
      {tokens.map((tok, idx) =>
        tok.isAcronym ? (
          <span key={idx} className="kbelia-acro">
            {tok.text}
          </span>
        ) : (
          <React.Fragment key={idx}>{tok.text}</React.Fragment>
        )
      )}
    </span>
  );
};

interface CurlyQuoteProps {
  text: string;
  className?: string;
}

export const CurlyQuoteText: React.FC<CurlyQuoteProps> = ({ text, className = '' }) => (
  <span className={className}>{toCurlyQuotes(text)}</span>
);

interface SupProps {
  children: React.ReactNode;
  className?: string;
}

export const Sup: React.FC<SupProps> = ({ children, className = '' }) => (
  <sup className={`kbelia-sup ${className}`}>{children}</sup>
);
