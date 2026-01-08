import React, { useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ConnectionMode } from 'reactflow';
// Removed failing CSS import as it's now in index.html

import { useStore } from './store';
import { nodeTypes } from './components/CustomNodes';
import AnalyticsPanel from './components/AnalyticsPanel';
import DebugTerminal from './components/DebugTerminal';
import { NodeType } from './types';

// Fix for ReactFlow nodeTypes memoization warning
const nodeTypesMemo = nodeTypes;

const App = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    addNode,
    connectWebSocket,
    clearStorage,
    addLog
  } = useStore();

  // Simulate connecting to a backend when app starts
  useEffect(() => {
    // In a real scenario, this matches the Python FastAPI backend URL
    connectWebSocket('ws://localhost:8000/ws/training'); 
  }, [connectWebSocket]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden text-slate-200">
      
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4 z-10 flex-shrink-0">
        <div className="text-blue-500 font-black text-2xl mb-4 italic tracking-tighter">NF</div>
        
        <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 items-center">
            <ToolbarButton label="Obj" onClick={() => addNode(NodeType.OBJECT)} color="bg-yellow-500" title="Environment Object" />
            <ToolbarButton label="Act" onClick={() => addNode(NodeType.PLAYER)} color="bg-green-500" title="Agent Action" />
            <div className="w-8 h-px bg-gray-800 my-1"></div>
            <ToolbarButton label="Math" onClick={() => addNode(NodeType.MATH)} color="bg-blue-500" title="Math Operation" />
            <ToolbarButton label="Log" onClick={() => addNode(NodeType.COMPARE)} color="bg-purple-500" title="Comparison Logic" />
            <ToolbarButton label="If?" onClick={() => addNode(NodeType.IF_ELSE)} color="bg-cyan-500" title="Conditional Switch" />
            <div className="w-8 h-px bg-gray-800 my-1"></div>
            <ToolbarButton label="Rwd" onClick={() => addNode(NodeType.REWARD)} color="bg-red-500" title="Reward Function" />
        </div>
        
        <div className="mt-auto mb-4 flex flex-col gap-2">
          <button 
            onClick={() => { 
                if(confirm("Clear workspace?")) {
                    clearStorage();
                    addLog("Graph cleared by user", "warning");
                }
            }}
            className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 hover:bg-red-900/40 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
            title="Clear Workspace"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 h-full relative overflow-hidden" onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypesMemo}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={true}
          snapGrid={[20, 20]}
          fitView
          className="bg-slate-900"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-gray-800 border-gray-700 fill-white !left-auto !right-4" />
          <MiniMap 
            className="bg-gray-800/80 border-gray-700 !bottom-12 !left-4" 
            nodeColor={(n) => {
                if (n.type === NodeType.REWARD) return '#ef4444';
                if (n.type === NodeType.PLAYER) return '#22c55e';
                if (n.type === NodeType.COMPARE) return '#a855f7';
                if (n.type === NodeType.IF_ELSE) return '#06b6d4';
                return '#3b82f6';
            }}
          />
        </ReactFlow>
        
        {/* Floating Overlay for Title */}
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur px-4 py-2 rounded border border-gray-700 text-white pointer-events-none z-10 shadow-2xl">
            <h1 className="font-bold text-lg tracking-tight">NeuroFlow <span className="text-blue-500">Builder</span></h1>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest opacity-70">Design Logic -> Export -> Train</p>
        </div>

        {/* Debug Terminal */}
        <DebugTerminal />
      </div>

      {/* Right Analytics Panel */}
      <AnalyticsPanel />
    </div>
  );
};

// Simple Toolbar helper
const ToolbarButton = ({ label, onClick, color, title }: { label: string, onClick: () => void, color: string, title?: string }) => (
    <button 
        onClick={onClick}
        className={`w-10 h-10 rounded-lg ${color} hover:opacity-90 text-black font-black text-[9px] flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 border border-black/10 uppercase`}
        title={title}
    >
        {label}
    </button>
);

export default App;
