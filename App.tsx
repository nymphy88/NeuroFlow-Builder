
import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ConnectionMode, Edge } from 'reactflow';
import { useStore } from './store';
import { nodeTypes } from './components/CustomNodes';
import AnalyticsPanel from './components/AnalyticsPanel';
import DebugTerminal from './components/DebugTerminal';
import { NodeType } from './types';

const nodeTypesMemo = nodeTypes;

const App = () => {
  const { 
    nodes, edges, onNodesChange, onEdgesChange, onConnect, onEdgeUpdate, deleteEdge,
    addNode, loadUISchema, clearStorage, addLog,
    undo, redo, past, future, takeSnapshot
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const edgeUpdateSuccessful = useRef(true);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          loadUISchema(json);
        } catch (err) {
          addLog("Failed to parse JSON schema file.", "error");
        }
      };
      
      const textReader = new FileReader();
      textReader.onload = (e) => {
         try {
            loadUISchema(JSON.parse(e.target?.result as string));
         } catch(err) {}
      };
      textReader.readAsText(file);
    }
  };

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Logic for dragging edge into space to delete
  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdateEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeUpdateSuccessful.current) {
      deleteEdge(edge.id);
    }
    edgeUpdateSuccessful.current = true;
  }, [deleteEdge]);

  const handleEdgeUpdate = useCallback((oldEdge: Edge, newConnection: any) => {
    edgeUpdateSuccessful.current = true;
    onEdgeUpdate(oldEdge, newConnection);
  }, [onEdgeUpdate]);

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden text-slate-200">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4 z-10 flex-shrink-0">
        <div className="text-blue-500 font-black text-2xl mb-4 italic tracking-tighter">NF</div>
        
        <div className="flex flex-col gap-3 items-center">
            <ToolbarButton label="UI" onClick={() => fileInputRef.current?.click()} color="bg-indigo-600 !text-white" title="Import UI Schema (JSON)" />
            
            <div className="w-8 h-px bg-gray-800 my-1"></div>
            
            <ToolbarButton label="Act" onClick={() => addNode(NodeType.UI_ACTION)} color="bg-orange-500" title="Action Button Node" />
            <ToolbarButton label="Val" onClick={() => addNode(NodeType.UI_STATE)} color="bg-emerald-500" title="Data State Node" />
            <ToolbarButton label="Op" onClick={() => addNode(NodeType.MATH)} color="bg-blue-500" title="Math Processor" />
            <ToolbarButton label="If?" onClick={() => addNode(NodeType.IF_ELSE)} color="bg-cyan-500" title="If/Else Branching Node" />
            <ToolbarButton label="Var" onClick={() => addNode(NodeType.VARIABLE)} color="bg-purple-500" title="Variable Storage Node" />
        </div>
        
        {/* Undo/Redo and Clear moved to the BOTTOM */}
        <div className="mt-auto mb-4 flex flex-col gap-2 items-center">
          <ToolbarButton 
            label={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>} 
            onClick={undo} 
            disabled={past.length === 0}
            color={past.length === 0 ? "bg-gray-800 text-gray-600 opacity-50" : "bg-gray-700 text-gray-200 hover:bg-gray-600"} 
            title="Undo (Ctrl+Z)" 
          />
          <ToolbarButton 
            label={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>} 
            onClick={redo} 
            disabled={future.length === 0}
            color={future.length === 0 ? "bg-gray-800 text-gray-600 opacity-50" : "bg-gray-700 text-gray-200 hover:bg-gray-600"} 
            title="Redo (Ctrl+Y)" 
          />
          
          <div className="w-8 h-px bg-gray-800 my-1"></div>

          <button onClick={() => confirm("Clear all nodes?") && clearStorage()} className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all" title="Clear All">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 h-full relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeUpdate={handleEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          onNodeDragStart={onNodeDragStart}
          nodeTypes={nodeTypesMemo}
          connectionMode={ConnectionMode.Loose}
          snapToGrid={true}
          snapGrid={[20, 20]}
          fitView
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="bg-gray-800 border-gray-700 fill-white !right-4 !left-auto" />
          <MiniMap className="bg-gray-800/80 border-gray-700 !bottom-12 !left-4" />
        </ReactFlow>
        
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur px-4 py-2 rounded border border-gray-700 text-white pointer-events-none z-10 shadow-2xl">
            <h1 className="font-bold text-lg tracking-tight">NeuroFlow <span className="text-blue-500">Logic</span></h1>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest opacity-70">UI Mapping -> Python Engine</p>
        </div>

        <DebugTerminal />
      </div>

      <AnalyticsPanel />
    </div>
  );
};

const ToolbarButton = ({ label, onClick, color, title, disabled }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`w-10 h-10 rounded-lg ${color} hover:opacity-90 text-black font-black text-[10px] flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 uppercase disabled:scale-100 disabled:opacity-50`} 
      title={title}
    >
        {label}
    </button>
);

export default App;
