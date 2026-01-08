import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import { AppNode, AppEdge, TrainingMetric, NodeType, DebugLog } from './types';
import { generatePythonGymEnv } from './utils/pythonGenerator';

const STORAGE_KEY = 'neuroflow-graph-state';

interface AppState {
  // Visual Graph State
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: NodeType) => void;
  updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
  deleteNode: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  toggleNodeBypass: (id: string) => void;

  // Debug Terminal State
  debugLogs: DebugLog[];
  addLog: (message: string, type?: DebugLog['type']) => void;
  clearLogs: () => void;

  // Real-time Analytics State
  isConnected: boolean;
  trainingData: TrainingMetric[];
  socket: WebSocket | null;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
  
  // Logic & Export
  generatedCode: string;
  generateCode: () => void;
  
  // Persistence
  saveToLocalStorage: () => void;
  clearStorage: () => void;
}

const defaultNodes: AppNode[] = [
  {
    id: 'agent-1',
    type: NodeType.PLAYER,
    position: { x: 100, y: 100 },
    data: { label: 'Agent Position', variableName: 'agent_pos', isAction: true, value: 0 },
  },
  {
    id: 'target-1',
    type: NodeType.OBJECT,
    position: { x: 100, y: 300 },
    data: { label: 'Target Position', variableName: 'target_pos', isObservation: true, value: 10 },
  },
  {
    id: 'math-1',
    type: NodeType.MATH,
    position: { x: 400, y: 200 },
    data: { label: 'Distance', operation: '-', variableName: 'distance' },
  },
  {
    id: 'reward-1',
    type: NodeType.REWARD,
    position: { x: 700, y: 200 },
    data: { label: 'Reward Function', variableName: 'reward' },
  },
];

const defaultEdges: AppEdge[] = [
  { id: 'e1-3', source: 'agent-1', target: 'math-1', sourceHandle: 'val', targetHandle: 'a' },
  { id: 'e2-3', source: 'target-1', target: 'math-1', sourceHandle: 'val', targetHandle: 'b' },
  { id: 'e3-4', source: 'math-1', target: 'reward-1', sourceHandle: 'val', targetHandle: 'input' },
];

const loadInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { nodes, edges } = JSON.parse(saved);
      // Ensure draggable property matches the isLocked state on load
      const sanitizedNodes = nodes.map((n: AppNode) => ({
        ...n,
        draggable: !n.data.isLocked
      }));
      return { nodes: sanitizedNodes, edges };
    }
  } catch (e) {
    console.error("Failed to load state from localStorage", e);
  }
  return { nodes: defaultNodes, edges: defaultEdges };
};

const initialState = loadInitialState();

export const useStore = create<AppState>((set, get) => ({
  nodes: initialState.nodes,
  edges: initialState.edges,
  isConnected: false,
  trainingData: [],
  socket: null,
  generatedCode: '',
  debugLogs: [],

  addLog: (message: string, type: DebugLog['type'] = 'info') => {
    const newLog: DebugLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    set((state) => ({ debugLogs: [newLog, ...state.debugLogs].slice(0, 50) }));
  },

  clearLogs: () => set({ debugLogs: [] }),

  saveToLocalStorage: () => {
    const { nodes, edges } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  },

  clearStorage: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ nodes: defaultNodes, edges: defaultEdges });
    get().addLog("Workspace cleared.", "warning");
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    get().saveToLocalStorage();
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    get().saveToLocalStorage();
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    });
    get().addLog(`Connected ${connection.source} to ${connection.target}`, "success");
    get().saveToLocalStorage();
  },

  addNode: (type: NodeType) => {
    const id = `${type}-${Date.now()}`;
    const newNode: AppNode = {
      id,
      type,
      position: { x: Math.floor(Math.random() * 10) * 40, y: Math.floor(Math.random() * 10) * 40 },
      data: { 
        label: `${type.toUpperCase()} node`, 
        variableName: `${type}_${Date.now().toString().slice(-4)}`,
        operation: type === NodeType.COMPARE ? '==' : (type === NodeType.MATH ? '+' : undefined),
        inputsPreview: {},
        isLocked: false,
        isBypassed: false
      },
    };
    set({ nodes: [...get().nodes, newNode] });
    get().addLog(`Added ${type} node: ${id}`);
    get().saveToLocalStorage();
  },

  updateNodeData: (id: string, data: Partial<AppNode['data']>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
    get().saveToLocalStorage();
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      edges: get().edges.filter(e => e.source !== id && e.target !== id)
    });
    get().addLog(`Deleted node ${id}`, "warning");
    get().saveToLocalStorage();
  },

  toggleNodeLock: (id: string) => {
    set({
      nodes: get().nodes.map(n => 
        n.id === id ? { ...n, draggable: !!n.data.isLocked, data: { ...n.data, isLocked: !n.data.isLocked } } : n
      )
    });
    const node = get().nodes.find(n => n.id === id);
    get().addLog(`Node ${id} ${!node?.data.isLocked ? 'Pinned' : 'Unpinned'}`);
    get().saveToLocalStorage();
  },

  toggleNodeBypass: (id: string) => {
    set({
      nodes: get().nodes.map(n => 
        n.id === id ? { ...n, data: { ...n.data, isBypassed: !n.data.isBypassed } } : n
      )
    });
    const node = get().nodes.find(n => n.id === id);
    get().addLog(`Node ${id} ${node?.data.isBypassed ? 'Bypassed' : 'Active'}`);
    get().saveToLocalStorage();
  },

  connectWebSocket: (url: string) => {
    get().addLog(`Attempting connection to ${url}...`);
    const socket = new WebSocket(url);

    socket.onopen = () => {
      set({ isConnected: true });
      get().addLog("WebSocket Connected successfully", "success");
    };

    socket.onmessage = (event) => {
      try {
        const data: TrainingMetric = JSON.parse(event.data);
        set((state) => {
            const newData = [...state.trainingData, data];
            return { trainingData: newData.slice(-100) };
        });
        
        if (data.reward !== undefined) {
           const rewardNode = get().nodes.find(n => n.type === NodeType.REWARD);
           if (rewardNode) {
             get().updateNodeData(rewardNode.id, { inputsPreview: { input: data.reward.toFixed(2) } });
           }
        }
      } catch (e) {
        get().addLog("Failed to parse training message", "error");
      }
    };

    socket.onclose = () => {
      set({ isConnected: false, socket: null });
      get().addLog("WebSocket Disconnected", "error");
    };

    set({ socket });
  },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ isConnected: false, socket: null });
  },

  generateCode: () => {
    try {
      const { nodes, edges } = get();
      const code = generatePythonGymEnv(nodes, edges);
      set({ generatedCode: code });
      get().addLog("Python code generated successfully", "success");
    } catch (e: any) {
      get().addLog(`Code generation failed: ${e.message}`, "error");
    }
  },
}));
