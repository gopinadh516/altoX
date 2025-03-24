import { useEffect, useState } from 'react';
import hljs from 'highlight.js';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import jsx from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github-dark.min.css';
import { generateCodeFromGemini } from '../shared/services/gemini-service';
import { NodeData, GeneratedCode, CopyStatus } from '../shared/types/gemini.types';
import prompts from '../prompts.json';
import './CodeGenerator.css';

// Register highlight.js languages
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('jsx', jsx);

interface CodeGeneratorProps {
  nodeData: NodeData[];
  hasSelection: boolean;
}

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <span>Generating code...</span>
  </div>
);

export function CodeGenerator({ nodeData, hasSelection }: CodeGeneratorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<keyof typeof prompts>(Object.keys(prompts)[0] as keyof typeof prompts);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const binary = new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    );
    return window.btoa(binary);
  };

  useEffect(() => {
    setGeneratedCode(null);
    setError(null);
    setCopyStatus('idle');
  }, [nodeData]);

  useEffect(() => {
    if (generatedCode?.code) {
      const codeElements = document.querySelectorAll('.code-preview > code');
      codeElements.forEach(element => {
        hljs.highlightElement(element as HTMLElement);
      });
    }
  }, [generatedCode]);

  const handleGenerateCode = async () => {
    if (!nodeData.length) {
      setError('No Figma nodes selected');
      return;
    }

    setIsLoading(true);
    setCopyStatus('idle');
    setError(null);

    try {
      console.log('Generating code with prompt:', selectedPrompt);
      const result = await generateCodeFromGemini({
        jsonData: nodeData[0].json,
        prompt: prompts[selectedPrompt]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('Generated code:', result);
      setGeneratedCode(result);
    } catch (error) {
      console.error('Code generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate code');
      setGeneratedCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (codeToCopy: string) => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const renderCode = (code: string, language: string) => {
    if (code.includes('---CSS---')) {
      const [htmlPart, cssPart] = code.split('---CSS---').map(part => part.trim());
      return (
        <>
          <div className="code-section">
            <div className="code-header">
              <span className="language-label">HTML</span>
              <button
                className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
                onClick={() => handleCopyCode(htmlPart)}
                disabled={copyStatus === 'copied' || isLoading}
              >
                {copyStatus === 'copied' ? 'Copied!' : 'Copy HTML'}
              </button>
            </div>
            <pre className="code-preview">
              <code className="language-html">{htmlPart}</code>
            </pre>
          </div>
          <div className="code-section">
            <div className="code-header">
              <span className="language-label">CSS</span>
              <button
                className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
                onClick={() => handleCopyCode(cssPart)}
                disabled={copyStatus === 'copied' || isLoading}
              >
                {copyStatus === 'copied' ? 'Copied!' : 'Copy CSS'}
              </button>
            </div>
            <pre className="code-preview">
              <code className="language-css">{cssPart}</code>
            </pre>
          </div>
        </>
      );
    }

    // Handle React/Tailwind or Bootstrap code
    const displayLanguage = language === 'jsx' ? 'React + Tailwind' : language.toUpperCase();
    return (
      <div className="code-section">
        <div className="code-header">
          <span className="language-label">{displayLanguage}</span>
          <button
            className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
            onClick={() => handleCopyCode(code)}
            disabled={copyStatus === 'copied' || isLoading}
          >
            {copyStatus === 'copied' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <pre className="code-preview">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="code-generator">
      {/* Node Preview Section */}
      <h3>Selected Components Preview</h3>
      {hasSelection && nodeData.length > 0 && (
     
        <div className="node-preview">
     
          <div className="image-preview">
            <img 
              src={`data:image/png;base64,${arrayBufferToBase64(nodeData[0].image)}`}
              alt="Selected component preview"
            />
          </div>
        </div>
      )}

      {/* Technology Selection Section */}
      {hasSelection && (
        <div className="prompt-section">
          <label htmlFor="prompt-select">Select Technology Stack:</label>
          <div className="controls-row">
            <select
              id="prompt-select"
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value as keyof typeof prompts)}
              disabled={isLoading}
            >
              {Object.keys(prompts).map(key => (
                <option key={key} value={key}>
                  {key.replace(/_/g, ' + ')}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateCode}
              disabled={!hasSelection || isLoading}
              className={`generate-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? <LoadingSpinner /> : 'Generate Code'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Generated Code Output */}
      {generatedCode && (
        <div className="code-output">
          {renderCode(generatedCode.code, generatedCode.language)}
        </div>
      )}
    </div>
  );
}