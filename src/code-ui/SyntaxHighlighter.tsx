import { useEffect } from 'react';
import hljs from 'highlight.js';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import jsx from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github-dark.min.css';

// Register highlight.js languages
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('jsx', jsx);

interface SyntaxHighlighterProps {
  code: string;
  language: string;
}

export const SyntaxHighlighter = ({ code, language }: SyntaxHighlighterProps) => {
  useEffect(() => {
    const codeElements = document.querySelectorAll('.code-preview > code');
    codeElements.forEach(element => {
      hljs.highlightElement(element as HTMLElement);
    });
  }, [code]);

  return (
    <pre className="code-preview">
      <code className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};