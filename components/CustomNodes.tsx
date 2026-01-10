
import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useStore } from '../store';
import { NodeType, BranchCase } from '../types';

const DataPreview = ({ nodeId }: { nodeId: string }) => {
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  
  const incoming = edges
    .filter(e => e.target === nodeId)
    .reduce((acc, edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        const handleId = edge.targetHandle || 'in';
        const val = (sourceNode.type === NodeType.UI_ACTION || sourceNode.type === NodeType.UI_NAV) 
          ? 'TRIGGER' 
          : (sourceNode.data.value ?? 'null');
        
        if (!acc[handleId]) acc[handleId] = [];
        acc[handleId].push(val);
      }
      return acc;
    }, {} as Record<string, any[]>);

  if (Object.keys(incoming).length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-white/5 flex flex-col gap-1">
      <div className="text-[7px] text-gray-500 font-black uppercase tracking-widest mb-1">Live Inputs</div>
      {(Object.entries(incoming) as [string, any[]][]).map(([key, vals]) => (
        <div key={key} className="flex flex-col bg-black/40 px-1.5 py-1 rounded text-[9px] font-mono mb-1">
          <span className="text-gray-500 text-[7px] uppercase tracking-tighter mb-0.5">{key}:</span>
          <div className="flex flex-wrap gap-1">
            {vals.map((v, i) => (
              <span key={i} className="text-blue-400 font-bold truncate">
                {String(v)}{i < vals.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const NodeMenu = ({ id, isLocked, isBypassed, isCollapsed, onRename }: { id: string, isLocked: boolean, isBypassed: boolean, isCollapsed: boolean, onRename: () => void }) => {
  const { deleteNode, toggleNodeLock, toggleNodeBypass, updateNodeData } = useStore();
  
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { isCollapsed: !isCollapsed });
  };

  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-[100]">
      <button onClick={(e) => { e.stopPropagation(); onRename(); }} className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors" title="Rename Node">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </button>
      <button onClick={toggleCollapse} className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isCollapsed ? 'text-blue-500' : 'text-gray-400'}`} title={isCollapsed ? "Expand" : "Collapse"}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={isCollapsed ? "m15 18-6-6 6-6" : "m6 9 6 6 6-6"} /></svg>
      </button>
      <div className="w-px h-5 bg-gray-700 mx-1"></div>
      <button onClick={(e) => { e.stopPropagation(); toggleNodeLock(id); }} className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isLocked ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400'}`} title="Lock Position">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
      </button>
      <button onClick={(e) => { e.stopPropagation(); toggleNodeBypass(id); }} className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isBypassed ? 'text-red-500 bg-red-500/10' : 'text-gray-400'}`} title="Bypass Node">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
      </button>
      <div className="w-px h-5 bg-gray-700 mx-1"></div>
      <button onClick={(e) => { e.stopPropagation(); deleteNode(id); }} className="p-1.5 rounded hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};

const NodeShell = ({ title, id, children, colorClass, selected, data }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(data.customName || data.label);
  const updateNodeData = useStore(s => s.updateNodeData);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeData(id, { customName: tempName });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);

  const displayTitle = data.customName || data.label || "Untitled Node";

  return (
    <div className={`group relative shadow-2xl rounded-lg border-2 min-w-[200px] bg-gray-900 transition-all duration-200 ${selected ? 'ring-4 ring-blue-500/20 scale-[1.01] border-white' : 'border-transparent'} ${data.isBypassed ? 'opacity-30 grayscale border-dashed border-gray-600' : colorClass}`}>
      <NodeMenu 
        id={id} 
        isLocked={!!data.isLocked} 
        isBypassed={!!data.isBypassed} 
        isCollapsed={!!data.isCollapsed}
        onRename={startRename}
      />
      
      <div className={`bg-black/40 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white border-b border-white/5 flex justify-between items-center ${data.isCollapsed ? 'rounded-lg' : 'rounded-t-lg'}`}>
        <div className="flex items-center gap-2 flex-1 mr-2 overflow-hidden">
          {data.isLocked && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>}
          
          {isEditing ? (
            <input
              ref={inputRef}
              className="bg-blue-900/50 text-white outline-none border-b border-blue-400 w-full px-1 nodrag nopan"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span 
              className={`truncate transition-colors ${data.isCollapsed ? 'cursor-grab' : 'cursor-text hover:text-blue-300'}`} 
              onClick={(e) => {
                if (!data.isCollapsed) {
                   e.stopPropagation();
                   startRename();
                }
              }}
            >
                {displayTitle}
            </span>
          )}
        </div>
        {!data.isCollapsed && <span className="text-[8px] opacity-40 font-mono shrink-0">{data.id_ref || id.slice(0, 8)}</span>}
      </div>

      {!data.isCollapsed && (
        <div className="p-4">
          {children}
          {data.purpose && <div className="mt-2 text-[8px] text-gray-500 italic leading-tight border-t border-white/5 pt-2">{data.purpose}</div>}
        </div>
      )}
    </div>
  );
};

const LargeHandle = (props: any) => {
  const handleSize = 14;
  const offset = -7; 

  const offsetStyle: React.CSSProperties = {
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    borderRadius: '4px', // Squared handles for a more technical look
    border: '2px solid rgba(0,0,0,0.6)',
    zIndex: 10,
    backgroundColor: 'inherit',
    ...(props.position === Position.Top ? { top: `${offset}px` } : {}),
    ...(props.position === Position.Bottom ? { bottom: `${offset}px` } : {}),
    ...(props.position === Position.Left ? { left: `${offset}px` } : {}),
    ...(props.position === Position.Right ? { right: `${offset}px` } : {}),
  };

  return (
    <Handle 
      {...props} 
      className={`${props.className} hover:!scale-125 transition-all !m-0 !absolute shadow-lg`} 
      style={{ ...offsetStyle, ...props.style }}
    />
  );
};

export const ActionNode: React.FC<NodeProps> = ({ id, data, selected }) => (
  <NodeShell id={id} colorClass="border-orange-500 shadow-orange-500/10" selected={selected} data={data}>
    <LargeHandle type="target" position={Position.Left} id="chain_input" className="!bg-orange-800" />
    <div className="flex flex-col items-center gap-2">
      <div className="text-[9px] text-orange-200 font-bold uppercase tracking-widest opacity-60">Action Trigger</div>
      <div className="bg-orange-500/10 w-full p-2.5 rounded border border-orange-500/20 text-center text-[10px] font-bold uppercase tracking-tight text-orange-400">
        {data.label}
      </div>
      <DataPreview nodeId={id} />
    </div>
    <LargeHandle type="source" position={Position.Right} id="trigger" className="!bg-orange-400" />
  </NodeShell>
);

export const StateNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);
  return (
    <NodeShell id={id} colorClass="border-emerald-500 shadow-emerald-500/10" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Left} id="set_value" className="!bg-emerald-600" />
      <div className="flex flex-col gap-2">
        <label className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Display State</label>
        <input 
            className="bg-gray-800 text-white text-[11px] p-2 rounded border border-gray-700 outline-none focus:border-emerald-500 nodrag nopan font-mono"
            value={data.value}
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
        />
        <div className="text-[8px] text-gray-500 font-mono truncate opacity-60 italic mt-1">{data.variableName}</div>
      </div>
      <DataPreview nodeId={id} />
      <LargeHandle type="source" position={Position.Right} id="current_value" className="!bg-emerald-400" />
    </NodeShell>
  );
};

export const MathNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);
  return (
    <NodeShell id={id} colorClass="border-blue-500 shadow-blue-500/10" selected={selected} data={data}>
      {/* Stacked inputs on the left */}
      <LargeHandle type="target" position={Position.Left} id="a" className="!bg-blue-600" style={{ top: '35%' }} />
      <LargeHandle type="target" position={Position.Left} id="b" className="!bg-blue-800" style={{ top: '65%' }} />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
           <span className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter">Operand A</span>
           <span className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter">Operand B</span>
        </div>
        <select 
            className="bg-gray-800 text-white text-[10px] p-2.5 rounded border border-gray-700 outline-none cursor-pointer nodrag font-bold"
            value={data.operation}
            onChange={(e) => updateNodeData(id, { operation: e.target.value })}
        >
            <option value="+">SUM (+)</option>
            <option value="-">DIFF (-)</option>
            <option value="*">PROD (*)</option>
            <option value="/">DIV (/)</option>
        </select>
        <div className="text-[7px] text-gray-500 text-center uppercase font-bold tracking-widest">Processor</div>
      </div>
      
      <LargeHandle type="source" position={Position.Right} id="val" className="!bg-blue-400" />
    </NodeShell>
  );
};

export const IfElseNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);
  const cases = data.cases || [];

  const addCase = () => {
    const newCase: BranchCase = { id: `case-${Date.now()}`, value: '0' };
    updateNodeData(id, { cases: [...cases, newCase] });
  };

  const removeCase = (idx: number) => {
    const newCases = cases.filter((_: any, i: number) => i !== idx);
    updateNodeData(id, { cases: newCases });
  };

  const updateCaseValue = (idx: number, val: string) => {
    const newCases = [...cases];
    newCases[idx] = { ...newCases[idx], value: val };
    updateNodeData(id, { cases: newCases });
  };

  return (
    <NodeShell id={id} colorClass="border-cyan-500 shadow-cyan-500/10" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Left} id="input_val" className="!bg-yellow-500" />
      
      <div className="flex flex-col gap-3 min-w-[220px]">
        <div className="text-[8px] text-cyan-400 font-black uppercase tracking-widest mb-1 text-center">Decision Logic</div>
        
        {cases.map((c: BranchCase, idx: number) => (
          <div key={c.id} className="relative group/case flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5">
             <div className="flex-1 flex flex-col gap-1">
                <span className="text-[7px] text-cyan-500 font-bold uppercase">IF VALUE ==</span>
                <input 
                  type="text"
                  className="bg-gray-800 text-white text-[10px] px-1.5 py-1 rounded border border-gray-700 outline-none focus:border-cyan-500 w-full nodrag nopan font-mono"
                  value={c.value}
                  onChange={(e) => updateCaseValue(idx, e.target.value)}
                />
             </div>
             
             <button 
               onClick={() => removeCase(idx)}
               className="text-gray-600 hover:text-red-500 transition-colors p-1"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
             </button>

             <LargeHandle 
               type="source" 
               position={Position.Right} 
               id={`case_out_${idx}`} 
               className="!bg-cyan-400" 
               style={{ top: '50%', transform: 'translateY(-50%)' }}
             />
          </div>
        ))}

        <button 
          onClick={addCase}
          className="w-full py-2 border border-dashed border-gray-700 rounded text-[9px] text-gray-500 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center justify-center gap-1 mt-1 font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
          ADD CONDITION
        </button>

        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center relative">
          <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest">Else (Fallback)</span>
          <LargeHandle type="source" position={Position.Right} id="default_branch" className="!bg-pink-500" />
        </div>
      </div>
    </NodeShell>
  );
};

export const VariableNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);
  return (
    <NodeShell id={id} colorClass="border-purple-500 shadow-purple-500/10" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Left} id="set" className="!bg-purple-600" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[8px] text-purple-400 font-black uppercase tracking-widest">Variable Ident</label>
          <input 
              className="bg-gray-800 text-white text-[11px] p-2 rounded border border-gray-700 outline-none focus:border-purple-500 font-mono nodrag nopan"
              placeholder="my_variable"
              value={data.variableName}
              onChange={(e) => updateNodeData(id, { variableName: e.target.value })}
          />
        </div>
        <div className="bg-purple-500/10 p-2.5 rounded border border-purple-500/20 text-center">
          <label className="text-[7px] text-gray-500 font-black uppercase block mb-1">Current State</label>
          <div className="text-[12px] font-mono font-bold text-purple-200">
            {data.value ?? 'UNDEFINED'}
          </div>
        </div>
      </div>
      <DataPreview nodeId={id} />
      <LargeHandle type="source" position={Position.Right} id="get" className="!bg-purple-400" />
    </NodeShell>
  );
};

export const nodeTypes = {
  [NodeType.UI_ACTION]: ActionNode,
  [NodeType.UI_STATE]: StateNode,
  [NodeType.UI_NAV]: ActionNode,
  [NodeType.UI_MEDIA]: StateNode,
  [NodeType.MATH]: MathNode,
  [NodeType.IF_ELSE]: IfElseNode,
  [NodeType.VARIABLE]: VariableNode,
};
