
import { Node, Edge } from 'reactflow';

export enum NodeType {
  // UI Mapped Types
  UI_ACTION = 'ui_action',   // Maps to Action_Button
  UI_STATE = 'ui_state',     // Maps to Data_Display
  UI_NAV = 'ui_nav',         // Maps to Navigation_Element
  UI_MEDIA = 'ui_media',     // Maps to Media_Container
  
  // Logic Processing
  MATH = 'math',
  COMPARE = 'compare',
  IF_ELSE = 'if_else',
  REWARD = 'reward',
  VARIABLE = 'variable'      // New Variable storage node
}

export type BranchCase = {
  id: string;
  value: string;
};

export type NodeData = {
  label: string;
  id_ref?: string;           // Original ID from JSON
  purpose?: string;          // Purpose from JSON
  value?: any;
  operation?: string;
  variableName?: string;
  inputsPreview?: Record<string, any>;
  isLocked?: boolean;
  isBypassed?: boolean;
  isCollapsed?: boolean;     // New: For minimizing nodes
  customName?: string;       // New: User defined display name
  cases?: BranchCase[];      // For Multi-Branch If/Else
};

export type AppNode = Node<NodeData>;
export type AppEdge = Edge;

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
