import { useState, useEffect } from 'react';
import { generateCodeFromGemini } from '../shared/services/gemini-service';
import { NodeData, GeneratedCode } from '../shared/types/gemini.types';
import { CodeSection } from './CodeSection';
import { LoadingSpinner } from './LoadingSpinner';
import prompts from '../prompts.json';
import './CodeGenerator.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface CodeGeneratorProps {
  nodeData: NodeData[];
  hasSelection: boolean;
}

type Tab = 'html' | 'css' | 'react';

export function CodeGenerator({ nodeData, hasSelection }: CodeGeneratorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<keyof typeof prompts>('html5_css');
  const [useBrandGuidelines, setUseBrandGuidelines] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [codeSections, setCodeSections] = useState<Record<Tab, string>>({
    html: '',
    css: '',
    react: '',
  });

  useEffect(() => {
    setGeneratedCode(null);
    setError(null);
    setCodeSections({
      html: '',
      css: '',
      react: '',
    });
  }, [nodeData]);

  useEffect(() => {
    if (generatedCode?.code) {
      // Dynamically split the generated code into sections based on the selected technology
      const htmlMatch = generatedCode.code.match(/<html[\s\S]*<\/html>/i);
      const cssMatch = generatedCode.code.match(/\/\*[\s\S]*?\*\/[\s\S]*}/i);
      const reactMatch = generatedCode.code.match(/import React[\s\S]*export default [\s\S]*;/i);

      setCodeSections({
        html: htmlMatch ? htmlMatch[0] : '',
        css: cssMatch ? cssMatch[0] : '',
        react: reactMatch ? reactMatch[0] : '',
      });
    }
  }, [generatedCode]);

  useEffect(() => {
    if (Object.values(codeSections).some((section) => section)) {
      hljs.highlightAll();
    }
  }, [codeSections]);

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
    setError(null);

    try {
      const promptKey = useBrandGuidelines ? 'brand_guidelines' : selectedPrompt;
      const result = await generateCodeFromGemini({
        jsonData: nodeData[0].json,
        prompt: prompts[promptKey],
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setGeneratedCode(result);
    } catch (error) {
      console.error('Code generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate code');
      setGeneratedCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunInBrowser = () => {
    if (!codeSections.html) {
      alert('No HTML code available to preview.');
      return;
    }

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            ${codeSections.css || ''}
          </style>
        </head>
        <body>
          ${codeSections.html || ''}
        </body>
        </html>
      `;
      newWindow.document.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const renderTabs = () => {
    const availableTabs = Object.entries(codeSections)
      .filter(([_, code]) => code) // Only include tabs with content
      .map(([tab]) => tab as Tab);

    return (
      <div className="tab-buttons">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} {/* Capitalize tab names */}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="code-generator">
      <h3>Selected Components Preview</h3>
      {/* Node Preview Section */}
      {hasSelection && nodeData.length > 0 && (
        <div className="node-preview">
          <div className="image-preview">
            <img
              src={`data:image/png;base64,${btoa(
                String.fromCharCode(...new Uint8Array(nodeData[0].image))
              )}`}
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
              disabled={isLoading || useBrandGuidelines}
            >
              <option value="html5_css">HTML + CSS</option>
              <option value="html_bootstrap5_css">HTML + Bootstrap5</option>
              <option value="react_tailwind">React + Tailwind</option>
            </select>
            <button
              onClick={handleGenerateCode}
              disabled={!hasSelection || isLoading}
              className={`generate-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? <LoadingSpinner /> : 'Generate Code'}
            </button>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="use-brand-guidelines"
              checked={useBrandGuidelines}
              onChange={(e) => setUseBrandGuidelines(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="use-brand-guidelines">Use Brand Guidelines</label>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Generated Code Output */}
      {generatedCode && (
        <div className="code-output">
          {renderTabs()}
          {activeTab === 'html' && codeSections.html && (
            <CodeSection code={codeSections.html} language="html" label="HTML Code" isLoading={isLoading} />
          )}
          {activeTab === 'css' && codeSections.css && (
            <CodeSection code={codeSections.css} language="css" label="CSS Code" isLoading={isLoading} />
          )}
          {activeTab === 'react' && codeSections.react && (
            <CodeSection code={codeSections.react} language="jsx" label="React Code" isLoading={isLoading} />
          )}
          <button
            className="run-browser-button"
            onClick={handleRunInBrowser}
            disabled={!codeSections.html}
          >
            Run in Browser
          </button>
        </div>
      )}
    </div>
  );
}