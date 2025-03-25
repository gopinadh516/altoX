import { useState, useEffect } from 'react';
import { generateCodeFromGemini } from '../shared/services/gemini-service';
import { NodeData, GeneratedCode, CopyStatus } from '../shared/types/gemini.types';
import { CodeSection } from './CodeSection';
import { LoadingSpinner } from './LoadingSpinner';
import prompts from '../prompts.json';
import './CodeGenerator.css';

interface CodeGeneratorProps {
  nodeData: NodeData[];
  hasSelection: boolean;
}

type CopyStates = {
  html?: CopyStatus;
  css?: CopyStatus;
  code?: CopyStatus;
};

export function CodeGenerator({ nodeData, hasSelection }: CodeGeneratorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<keyof typeof prompts>(
    Object.keys(prompts)[0] as keyof typeof prompts
  );
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyStates, setCopyStates] = useState<CopyStates>({});
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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
    setCopyStates({});
    setIsVisible(true);
  }, [nodeData]);

  const handleGenerateCode = async () => {
    if (!nodeData.length) {
      setError('Please select a node in Figma');
      return;
    }

    if (!nodeData[0].json) {
      setError('Invalid node data received');
      return;
    }

    setIsLoading(true);
    setIsVisible(false);
    setCopyStates({});
    setError(null);

    try {
      const result = await generateCodeFromGemini({
        jsonData: nodeData[0].json,
        prompt: prompts[selectedPrompt]
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setGeneratedCode(result);
      setIsVisible(true);
    } catch (error) {
      console.error('Code generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate code');
      setGeneratedCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string, type: keyof CopyStates) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStates(prev => ({ ...prev, [type]: 'copied' }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      setCopyStates(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    }
  };

  const renderCode = (code: string, language: string) => {
    if (code.includes('---CSS---')) {
      const [htmlPart, cssPart] = code.split('---CSS---').map(part => part.trim());
      return (
        <>
          <CodeSection
            code={htmlPart}
            language="html"
            label="HTML"
            copyStatus={copyStates.html || 'idle'}
            isLoading={isLoading}
            onCopy={(code) => handleCopyCode(code, 'html')}
          />
          <CodeSection
            code={cssPart}
            language="css"
            label="CSS"
            copyStatus={copyStates.css || 'idle'}
            isLoading={isLoading}
            onCopy={(code) => handleCopyCode(code, 'css')}
          />
        </>
      );
    }

    const displayLanguage = language === 'jsx' ? 'React + Tailwind' : language.toUpperCase();
    return (
      <CodeSection
        code={code}
        language={language}
        label={displayLanguage}
        copyStatus={copyStates.code || 'idle'}
        isLoading={isLoading}
        onCopy={(code) => handleCopyCode(code, 'code')}
      />
    );
  };

  return (
    <div className="code-generator">
      {/* Node Preview Section */}
      {hasSelection && nodeData.length > 0 && (
        <div className="node-preview">
          <h3>Selected Components Preview</h3>
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
        <div className="error-message">{error}</div>
      )}

      {/* Generated Code Output */}
      {generatedCode && isVisible && (
        <div className="code-output">
          {renderCode(generatedCode.code, generatedCode.language)}
        </div>
      )}
    </div>
  );
}