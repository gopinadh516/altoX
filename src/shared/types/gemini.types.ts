export interface NodeData {
  json: any;
  image: ArrayBuffer;
}
export interface GeneratedCode {
  code: string;
  language: string;
  error?: string;
}
export interface GeminiRequest {
  prompt: string;
  jsonData: any;
}

export interface GeminiResponse {
  code: string;
  language: string;
  error?: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  style: {
    position: {
      x: number;
      y: number;
    };
    size: {
      width: number;
      height: number;
    };
    opacity?: number;
    visible?: boolean;
    text?: {
      fontSize: string;
      fontFamily: string;
      fontWeight: string;
      textAlign: string;
      verticalAlign: string;
      lineHeight: string;
      color: string;
    };
    background?: string;
    border?: {
      width: number;
      color: string;
      style: string;
    };
    borderRadius?: string;
    layout?: {
      display: string;
      direction: string;
      gap: string;
      padding: {
        top: string;
        right: string;
        bottom: string;
        left: string;
      };
      justifyContent: string;
      alignItems: string;
    };
  };
  content?: string;
  children?: FigmaNode[];
}

export type CopyStatus = 'idle' | 'copied' | 'error';
export interface GeminiResponse extends GeneratedCode {}