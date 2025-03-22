export interface GeminiRequest {
  jsonData: any;
  prompt: string;
}

export interface GeminiResponse {
  code: string;
  language: string;
  error?: string;
}

export interface NodeData {
  image: ArrayBuffer;
  json: any;
}