import { useEffect, useState } from 'react';
import './App.css';
import { NodeData } from './shared/types/gemini.types';
import { CodeGenerator } from './code-ui/codegenerator';

function App() {
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [hasSelection, setHasSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Send ready message to plugin
    parent.postMessage({ pluginMessage: { type: 'ready' } }, '*');

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;

      switch (msg.type) {
        case 'export-data':
          if (!msg.data || !Array.isArray(msg.data)) {
            setError('Invalid data received from Figma');
            return;
          }
          setNodeData(msg.data);
          setHasSelection(true);
          setError(null);
          break;

        case 'no-selection':
          setNodeData([]);
          setHasSelection(false);
          setError('Please select a node in Figma');
          break;

        case 'export-error':
          setError(msg.error || 'Error processing Figma selection');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="container">
      {error && (
        <div className="error-message">{error}</div>
      )}
      <CodeGenerator 
        nodeData={nodeData}
        hasSelection={hasSelection}
      />
    </div>
  );
}

export default App;