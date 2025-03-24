import { useEffect, useState } from 'react';
import { generateCodeFromGemini } from '../shared/services/gemini-service';
import { NodeData } from '../shared/types/gemini.types';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
import prompts from '../prompts.json';
import './CodeGenerator.css';

interface GeneratedCode {
  code: string;
  language: string;
  error?: string;
}

interface Prompts {
  [key: string]: string;
}

const typedPrompts: Prompts = prompts as Prompts;

interface CodeGeneratorProps {
  nodeData: NodeData[];
  hasSelection: boolean;
}

function RenderNodeStructure({ node }: { node: any }) {
  return (
    <>
        {/* <div className="node-structure">
      <div className="node-header">
        <span className="node-type">{node.type}</span>
        <span className="node-name">{node.name}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="node-children">
          {node.children.map((child: any, index: number) => (
            <RenderNodeStructure key={child.id || index} node={child} />
          ))}
        </div>
      )}
    </div> */}
    </>

  );
}

export function CodeGenerator({ nodeData, hasSelection }: CodeGeneratorProps) {
  const [selectedPrompt, setSelectedPrompt] = useState('html_css');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (generatedCode && generatedCode.code) {
      hljs.highlightAll();
    }
  }, [generatedCode]);

  const handleGenerateCode = async () => {
    if (!nodeData.length) return;

    setIsLoading(true);
    setCopyStatus('idle');
    try {
      const result = await generateCodeFromGemini({
        jsonData: nodeData[0].json,
        prompt: typedPrompts[selectedPrompt]
      });
      setGeneratedCode(result);
    } catch (error) {
      setGeneratedCode({
        code: '',
        language: '',
        error: error instanceof Error ? error.message : 'Failed to generate code'
      });
    }
    setIsLoading(false);
  };

  const handleCopyCode = async () => {
    if (!generatedCode?.code) return;

    try {
      // For secure contexts (HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedCode.code);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = generatedCode.code;
        
        // Make the textarea out of viewport
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        try {
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          textArea.remove();
          setCopyStatus('error');
          return;
        }
      }
      
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="code-generator">
      <h3>Selected Nodes Preview</h3>
      <div className="image-container">
        <div className="images">
          {hasSelection ? (
            nodeData.map((item, index) => (
              <div key={index} className="node-preview">
                <img
                  src={URL.createObjectURL(new Blob([item.image]))}
                  alt={`Node ${index + 1}`}
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <div className="node-info">
                  <RenderNodeStructure node={item.json} />
                </div>
              </div>
            ))
          ) : (
            <p>No selection</p>
          )}
        </div>
      </div>

      <div className="prompt-section">
        <label htmlFor="prompt-select">Select a technology stack:</label>
        <select
          id="prompt-select"
          value={selectedPrompt}
          onChange={(e) => setSelectedPrompt(e.target.value)}
        >
          {Object.keys(prompts).map(key => (
            <option key={key} value={key}>
              {key.replace('_', ' + ')}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerateCode}
          disabled={!hasSelection || isLoading}
          className="generate-button"
        >
          {isLoading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      {generatedCode && (
        <div className="code-output">
          <div className="code-header">
            <span className="language-label">
              {generatedCode.language.toUpperCase()}
            </span>
            <button
              className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
              onClick={handleCopyCode}
              disabled={!generatedCode.code || copyStatus === 'copied'}
              data-status={copyStatus}
            >
              {copyStatus === 'copied' ? 'Copied!' : 
               copyStatus === 'error' ? 'Failed to copy' : 
               'Copy Code'}
            </button>
          </div>
          {generatedCode.error ? (
            <div className="error">{generatedCode.error}</div>
          ) : (
            <pre className="code-preview">
              <code className={`language-${generatedCode.language}`}>
                {generatedCode.code}
              </code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}