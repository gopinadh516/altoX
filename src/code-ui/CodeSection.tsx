import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';

interface CodeSectionProps {
  code: string;
  language: string;
  label: string;
  isLoading: boolean;
}

export const CodeSection: React.FC<CodeSectionProps> = ({
  code,
  language,
  label,
  isLoading,
}) => {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightBlock(preRef.current.querySelector('code') as HTMLElement);
    }
  }, [code, language]);

  return (
    <div className="code-section">
      <div className="code-header">
        <span className="language-label">{label}</span>
      </div>
      <pre ref={preRef}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};