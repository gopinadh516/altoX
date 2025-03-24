import { useEffect, useState } from 'react';
import './App.css';
import { NodeData } from './shared/types/gemini.types';
import { CodeGenerator } from './code-ui/codegenerator';

function App() {
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [hasSelection, setHasSelection] = useState(true);

  useEffect(() => {
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

  return (
    <div className="container">
      <CodeGenerator 
        nodeData={nodeData}
        hasSelection={hasSelection}
      />
    </div>
  );
}

export default App;