import { SyntaxHighlighter } from './SyntaxHighlighter';
import { CopyStatus } from '../shared/types/gemini.types';
import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';

interface CodeSectionProps {
  code: string;
  language: string;
  label: string;
  copyStatus: CopyStatus;
  isLoading: boolean;
  onCopy: (code: string) => void;
}

export const CodeSection: React.FC<CodeSectionProps> = ({
  code,
  language,
  label,
  copyStatus,
  isLoading,
  onCopy
}) => {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightBlock(preRef.current.querySelector('code') as HTMLElement);
    }
  }, [code, language]);

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copied':
        return 'Copied!';
      case 'error':
        return 'Failed to copy';
      default:
        return `Copy ${label}`;
    }
  };

  return (
    <div className="code-section">
      <div className="code-header">
        <span className="language-label">{label}</span>
        <button
          className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
          onClick={() => onCopy(code)}
          disabled={copyStatus === 'copied' || isLoading}
        >
          {getCopyButtonText()}
        </button>
      </div>
      <pre ref={preRef}><code className={`language-${language}`}>{code}</code></pre>
    </div>
  );
};