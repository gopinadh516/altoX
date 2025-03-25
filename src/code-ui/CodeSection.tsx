import { SyntaxHighlighter } from './SyntaxHighlighter';
import { CopyStatus } from '../shared/types/gemini.types';

interface CodeSectionProps {
  code: string;
  language: string;
  label: string;
  copyStatus: CopyStatus;
  isLoading: boolean;
  onCopy: (code: string) => void;
}
export const CodeSection: React.FC<CodeSectionProps> = ({
    code,
    language,
    label,
    copyStatus,
    isLoading,
    onCopy
  }) => {
    const getCopyButtonText = () => {
      switch (copyStatus) {
        case 'copied':
          return 'Copied!';
        case 'error':
          return 'Failed to copy';
        default:
          return `Copy ${label}`;
      }
    };
  
    return (
      <div className="code-section">
        <div className="code-header">
          <span className="language-label">{label}</span>
          <button
            className={`copy-button ${copyStatus !== 'idle' ? `copy-button--${copyStatus}` : ''}`}
            onClick={() => onCopy(code)}
            disabled={copyStatus === 'copied' || isLoading}
          >
            {getCopyButtonText()}
          </button>
        </div>
        <SyntaxHighlighter code={code} language={language} />
      </div>
    );
  };