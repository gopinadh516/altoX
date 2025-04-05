import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // Use a proper dark theme

interface SyntaxHighlighterProps {
  code: string;
  language: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ code, language }) => {
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <pre className="code-preview">
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};