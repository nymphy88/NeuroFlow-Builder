import { Node, Edge } from 'reactflow';

// --- Visual Logic Types ---

export enum NodeType {
  OBJECT = 'object',
  LOGIC = 'logic',
  MATH = 'math',
  PLAYER = 'player', // Represents the Agent
  REWARD = 'reward', // Represents the Goal/Feedback
  PRINT = 'print',
  COMPARE = 'compare',
  IF_ELSE = 'if_else'
}

export type NodeData = {
  label: string;
  value?: string | number;
  operation?: string; // For logic/math (+, -, *, /, >, ==)
  variableName?: string;
  isObservation?: boolean; // If true, this value is part of the RL observation space
  isAction?: boolean; // If true, this value is controlled by the RL agent
  inputsPreview?: Record<string, any>; // Stores current data flowing into handles for preview
  isLocked?: boolean;
  isBypassed?: boolean;
};

export type AppNode = Node<NodeData>;
export type AppEdge = Edge;

// --- Analytics & Debug Types ---

export interface TrainingMetric {
  episode: number;
  reward: number;
  loss: number;
  steps: number;
}

export interface DebugLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
}

// --- Generator Types ---

export interface GeneratedCode {
  filename: string;
  content: string;
}

// --- LLM Insight Types ---

export interface InsightResponse {
  analysis: string;
  suggestions: string[];
}
