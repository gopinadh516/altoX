// filepath: d:\workspace\altoX\src\app.tsx
import { useEffect, useState } from 'react';
import './App.css';
import { generateCodeFromGemini } from './shared/services/gemini-service';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css'; // You can choose a different style

interface NodeData {
  image: ArrayBuffer;
  json: any;
}

interface GeneratedCode {
  code: string;
  language: string;
  error?: string;
}

function App() {
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [hasSelection, setHasSelection] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Send initial ready message
    parent.postMessage({ pluginMessage: { type: 'ready' } }, '*');

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      if (msg.type === 'export-data') {
        setNodeData(msg.data);
        setHasSelection(true);
      } else if (msg.type === 'no-selection') {
        setNodeData([]);
        setHasSelection(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (generatedCode && generatedCode.code) {
      hljs.highlightAll();
    }
  }, [generatedCode]);

  const handleGenerateCode = async () => {
    if (!nodeData.length) return;

    setIsLoading(true);
    try {
      const result = await generateCodeFromGemini({
        jsonData: nodeData[0].json,
        prompt
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

  return (
    <div className="container">
      <div className="prompt-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt for code generation..."
          rows={4}
        />
        <button
          onClick={handleGenerateCode}
          disabled={!hasSelection || isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Code'}
        </button>
      </div>

      <div className="code-output">
        {generatedCode && (
          <>
            {generatedCode.error ? (
              <div className="error">{generatedCode.error}</div>
            ) : (
              <pre className="code-preview">
                <code className={`language-${generatedCode.language}`}>
                  {generatedCode.code}
                </code>
              </pre>
            )}
          </>
        )}
      </div>

      <div className="image-container">
        <h3>Exported Images</h3>
        <div className="images">
          {hasSelection ? (
            nodeData.map((item, index) => {
              const blob = new Blob([item.image]);
              const imageUrl = URL.createObjectURL(blob);
              return (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Node ${index + 1}`}
                  onLoad={() => URL.revokeObjectURL(imageUrl)}
                />
              );
            })
          ) : (
            <p>No selection</p>
          )}
        </div>
      </div>

      <div className="json-container">
        <h3>JSON new Data</h3>
        <div className="json-viewer">
          {hasSelection ? (
            nodeData.map((item, index) => (
              <pre key={index}>
                {JSON.stringify(item.json, null, 2)}
              </pre>
            ))
          ) : (
            <p>No selection</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;