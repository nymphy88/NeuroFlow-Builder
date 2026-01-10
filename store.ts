
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
  updateEdge,
  Edge,
} from 'reactflow';
import { AppNode, AppEdge, TrainingMetric, NodeType, DebugLog } from './types';
import { generatePythonGymEnv } from './utils/pythonGenerator';

const STORAGE_KEY = 'neuroflow-ui-logic-state';

interface HistoryState {
  nodes: AppNode[];
  edges: AppEdge[];
}

interface AppState {
  nodes: AppNode[];
  edges: AppEdge[];
  past: HistoryState[];
  future: HistoryState[];
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  addNode: (type: NodeType, initialData?: Partial<AppNode['data']>) => void;
  updateNodeData: (id: string, data: Partial<AppNode['data']>) => void;
  deleteNode: (id: string) => void;
  toggleNodeLock: (id: string) => void;
  toggleNodeBypass: (id: string) => void;
  
  loadUISchema: (json: any) => void;

  debugLogs: DebugLog[];
  addLog: (message: string, type?: DebugLog['type']) => void;
  clearLogs: () => void;

  isConnected: boolean;
  trainingData: TrainingMetric[];
  socket: WebSocket | null;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
  
  generatedCode: string;
  generateCode: () => void;
  
  saveToLocalStorage: () => void;
  clearStorage: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  isConnected: false,
  trainingData: [],
  socket: null,
  generatedCode: '',
  debugLogs: [],

  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    const currentSnapshot = { nodes, edges };
    
    // Break references to prevent history mutation
    const snapshotStr = JSON.stringify(currentSnapshot);
    const lastSnapshotStr = past.length > 0 ? JSON.stringify(past[past.length - 1]) : null;

    // Avoid redundant snapshots if state hasn't actually changed
    if (snapshotStr === lastSnapshotStr) return;

    set({
      past: [...past, JSON.parse(snapshotStr)].slice(-50),
      future: []
    });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const current = JSON.parse(JSON.stringify({ nodes, edges }));

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: [current, ...future]
    });
    get().addLog("Undo: Restored previous logic state", "info");
    get().saveToLocalStorage();
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = JSON.parse(JSON.stringify({ nodes, edges }));

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, current],
      future: newFuture
    });
    get().addLog("Redo: Re-applied logic change", "info");
    get().saveToLocalStorage();
  },

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
    get().takeSnapshot();
    localStorage.removeItem(STORAGE_KEY);
    set({ nodes: [], edges: [] });
    get().addLog("Workspace cleared.", "warning");
  },

  loadUISchema: (schema: any) => {
    if (!schema || !schema.elements) {
        get().addLog("Invalid UI Schema provided.", "error");
        return;
    }

    get().takeSnapshot();

    const newNodes: AppNode[] = schema.elements.map((el: any, index: number) => {
        let type = NodeType.UI_NAV;
        if (el.type === 'Action_Button') type = NodeType.UI_ACTION;
        if (el.type === 'Data_Display') type = NodeType.UI_STATE;
        if (el.type === 'Media_Container') type = NodeType.UI_MEDIA;

        return {
            id: el.id,
            type: type,
            position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 200 },
            data: {
                label: el.id.replace(/_/g, ' ').toUpperCase(),
                id_ref: el.id,
                purpose: el.purpose,
                variableName: el.id,
                value: 0,
                inputsPreview: {}
            }
        };
    });

    set({ nodes: newNodes, edges: [] });
    get().addLog(`Imported ${newNodes.length} UI elements as nodes.`, "success");
    get().saveToLocalStorage();
  },

  onNodesChange: (changes: NodeChange[]) => {
    // Detect keyboard deletions or external removals
    const isRemoval = changes.some(c => c.type === 'remove');
    if (isRemoval) {
        get().takeSnapshot();
        get().addLog("Node(s) removed via keyboard/action", "warning");
    }
    
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    get().saveToLocalStorage();
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    // Detect keyboard deletions or external removals
    const isRemoval = changes.some(c => c.type === 'remove');
    if (isRemoval) {
        get().takeSnapshot();
        get().addLog("Link(s) removed via keyboard/action", "warning");
    }

    set({ edges: applyEdgeChanges(changes, get().edges) });
    get().saveToLocalStorage();
  },

  onConnect: (connection: Connection) => {
    get().takeSnapshot();
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) });
    get().addLog(`Logic link established`, "info");
    get().saveToLocalStorage();
  },

  onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
    get().takeSnapshot();
    set({ edges: updateEdge(oldEdge, newConnection, get().edges) });
    get().addLog(`Logic link updated`, "info");
    get().saveToLocalStorage();
  },

  deleteEdge: (edgeId: string) => {
    get().takeSnapshot();
    set({ edges: get().edges.filter(e => e.id !== edgeId) });
    get().addLog("Link disconnected", "warning");
    get().saveToLocalStorage();
  },

  addNode: (type: NodeType, initialData = {}) => {
    get().takeSnapshot();
    const id = `${type}-${Date.now()}`;
    
    let nodeData: any = { 
      label: `${type.toUpperCase()} node`, 
      variableName: `${type}_${Date.now().toString().slice(-4)}`,
      inputsPreview: {},
      ...initialData
    };

    if (type === NodeType.IF_ELSE) {
      nodeData.cases = [{ id: 'case-0', value: '1' }];
    }

    const newNode: AppNode = {
      id,
      type,
      position: { x: 100, y: 100 },
      data: nodeData,
    };
    set({ nodes: [...get().nodes, newNode] });
    get().addLog(`Added ${type} node`, "info");
    get().saveToLocalStorage();
  },

  updateNodeData: (id: string, data: Partial<AppNode['data']>) => {
    // Only snapshot if the data being updated is structural logic
    if (data.value !== undefined || data.variableName !== undefined || data.operation !== undefined || data.cases !== undefined) {
      get().takeSnapshot();
    }
    
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) return { ...node, data: { ...node.data, ...data } };
        return node;
      }),
    });
    get().saveToLocalStorage();
  },

  deleteNode: (id: string) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter(n => n.id !== id),
      edges: get().edges.filter(e => e.source !== id && e.target !== id)
    });
    get().addLog("Node deleted", "warning");
    get().saveToLocalStorage();
  },

  toggleNodeLock: (id: string) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map(n => 
        n.id === id ? { ...n, draggable: !!n.data.isLocked, data: { ...n.data, isLocked: !n.data.isLocked } } : n
      )
    });
    get().saveToLocalStorage();
  },

  toggleNodeBypass: (id: string) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map(n => 
        n.id === id ? { ...n, data: { ...n.data, isBypassed: !n.data.isBypassed } } : n
      )
    });
    get().saveToLocalStorage();
  },

  connectWebSocket: (url: string) => {
    const socket = new WebSocket(url);
    socket.onopen = () => set({ isConnected: true });
    socket.onmessage = (event) => {
      try {
        const data: TrainingMetric = JSON.parse(event.data);
        set((state) => ({ trainingData: [...state.trainingData, data].slice(-100) }));
      } catch (e) {}
    };
    socket.onclose = () => set({ isConnected: false, socket: null });
    set({ socket });
  },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) socket.close();
    set({ isConnected: false, socket: null });
  },

  generateCode: () => {
    const { nodes, edges } = get();
    const code = generatePythonGymEnv(nodes, edges);
    set({ generatedCode: code });
    get().addLog("Python Logic Code Generated", "success");
  },
}));
