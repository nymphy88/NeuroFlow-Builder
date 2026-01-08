import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useStore } from '../store';
import { NodeType } from '../types';

// Node Menu Component
const NodeMenu = ({ id, isLocked, isBypassed }: { id: string, isLocked: boolean, isBypassed: boolean }) => {
  const { deleteNode, toggleNodeLock, toggleNodeBypass } = useStore();
  
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-auto">
      <button 
        onClick={(e) => { e.stopPropagation(); toggleNodeLock(id); }}
        className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isLocked ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400'}`}
        title={isLocked ? "Unpin Node" : "Pin Node"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22"></line>
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
        </svg>
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleNodeBypass(id); }}
        className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isBypassed ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
        title={isBypassed ? "Enable Node" : "Bypass Node"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="w-px h-5 bg-gray-700 mx-1"></div>
      <button 
        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
        className="p-1.5 rounded hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-colors"
        title="Delete Node"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Generic styling wrapper
const NodeShell = ({ title, id, children, colorClass, selected, data }: React.PropsWithChildren<{ title: string, id: string, colorClass: string, selected?: boolean, data: any }>) => (
  <div className={`group relative shadow-2xl rounded-md border-2 min-w-[170px] bg-gray-900 transition-all duration-200 ${selected ? 'ring-4 ring-blue-500/30 scale-[1.02] z-50 border-white' : 'border-transparent'} ${data.isBypassed ? 'opacity-40 border-dashed border-gray-600 grayscale' : colorClass}`}>
    {/* Hover Menu */}
    <NodeMenu id={id} isLocked={!!data.isLocked} isBypassed={!!data.isBypassed} />
    
    <div className="bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white border-b border-white/5 flex justify-between items-center rounded-t-[4px]">
      <div className="flex items-center gap-2">
        {data.isLocked && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>}
        <span>{title}</span>
      </div>
      {selected && <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>}
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

// Port Value Preview
const PortPreview = ({ value, position }: { value: any, position: 'top' | 'bottom' | 'left' | 'right' }) => {
  if (value === undefined || value === null) return null;
  
  const posClasses = {
    top: '-top-12 left-1/2 -translate-x-1/2',
    bottom: '-bottom-12 left-1/2 -translate-x-1/2',
    left: '-left-20 top-1/2 -translate-y-1/2',
    right: '-right-20 top-1/2 -translate-y-1/2'
  };

  return (
    <div className={`absolute ${posClasses[position]} bg-black/90 text-[10px] px-2 py-1 rounded-md border border-white/20 text-white whitespace-nowrap z-[110] pointer-events-none font-mono shadow-2xl backdrop-blur-sm`}>
      <span className="text-blue-300 mr-1 opacity-60">VAL</span>
      <span className="text-green-400 font-bold">{value}</span>
    </div>
  );
};

// Styled large handle correctly positioned
const LargeHandle = (props: any) => {
  const previewValue = props.data?.inputsPreview?.[props.id || 'val'];
  const handleSize = 16;
  const offset = -(handleSize / 2); // To center exactly on edge

  // React Flow internal styling uses top/left percentages. 
  // We override with absolute pixel offsets to center the dot.
  const offsetStyle: React.CSSProperties = {
    width: `${handleSize}px`,
    height: `${handleSize}px`,
    borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.5)',
    zIndex: 10,
    ...(props.position === Position.Top ? { top: `${offset}px` } : {}),
    ...(props.position === Position.Bottom ? { bottom: `${offset}px` } : {}),
    ...(props.position === Position.Left ? { left: `${offset}px` } : {}),
    ...(props.position === Position.Right ? { right: `${offset}px` } : {}),
  };

  return (
    <>
      <Handle 
        {...props} 
        className={`${props.className} !w-[16px] !h-[16px] !border-2 !border-gray-900 hover:!scale-150 transition-all duration-150 !cursor-crosshair shadow-lg !m-0`} 
        style={{ ...offsetStyle, ...props.style }}
      />
      {previewValue !== undefined && (
        <PortPreview 
          value={previewValue} 
          position={props.position.toLowerCase() as any} 
        />
      )}
    </>
  );
};

export const MathNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);

  return (
    <NodeShell title="Math Op" id={id} colorClass="border-blue-500" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Top} id="a" className="!bg-blue-400" data={data} style={{ left: '30%' }} />
      <LargeHandle type="target" position={Position.Top} id="b" className="!bg-blue-400" data={data} style={{ left: '70%' }} />
      
      <div className="flex flex-col gap-3">
        <input 
            className="bg-gray-800 text-white text-[10px] p-2 rounded border border-gray-700 focus:border-blue-500 outline-none transition-colors" 
            value={data.label} 
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            placeholder="Label..."
        />
        <select 
            className="bg-gray-800 text-white text-[10px] p-2 rounded border border-gray-700 focus:border-blue-500 outline-none cursor-pointer"
            value={data.operation}
            onChange={(e) => updateNodeData(id, { operation: e.target.value })}
        >
            <option value="+">Add (+)</option>
            <option value="-">Subtract (-)</option>
            <option value="*">Multiply (*)</option>
            <option value="/">Divide (/)</option>
        </select>
        <div className="text-[9px] text-gray-500 font-mono tracking-tighter">VAR: {data.variableName}</div>
      </div>

      <LargeHandle type="source" position={Position.Bottom} id="val" className="!bg-blue-400" />
    </NodeShell>
  );
};

export const CompareNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const updateNodeData = useStore(state => state.updateNodeData);

  return (
    <NodeShell title="Compare" id={id} colorClass="border-purple-500" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Top} id="a" className="!bg-purple-400" data={data} style={{ left: '30%' }} />
      <LargeHandle type="target" position={Position.Top} id="b" className="!bg-purple-400" data={data} style={{ left: '70%' }} />
      
      <div className="flex flex-col gap-3">
        <select 
            className="bg-gray-800 text-white text-[10px] p-2 rounded border border-gray-700 focus:border-purple-500 outline-none cursor-pointer"
            value={data.operation}
            onChange={(e) => updateNodeData(id, { operation: e.target.value })}
        >
            <option value="==">Equals (==)</option>
            <option value="!=">Not Equals (!=)</option>
            <option value=">">Greater Than (&gt;)</option>
            <option value="<">Less Than (&lt;)</option>
            <option value=">=">Greater or Equal (&gt;=)</option>
            <option value="<=">Less or Equal (&lt;=)</option>
        </select>
        <div className="text-[9px] text-purple-400/60 font-mono uppercase font-black">Output: Boolean</div>
      </div>

      <LargeHandle type="source" position={Position.Bottom} id="val" className="!bg-purple-400" />
    </NodeShell>
  );
};

export const IfElseNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  return (
    <NodeShell title="If / Else" id={id} colorClass="border-cyan-500" selected={selected} data={data}>
      <LargeHandle type="target" position={Position.Top} id="condition" className="!bg-yellow-400" data={data} />
      <div className="text-[8px] text-center text-yellow-500/80 mb-2 font-black tracking-widest">CONDITION</div>
      
      <div className="flex justify-between items-center py-5 bg-black/30 rounded-lg border border-white/5 my-2 px-1 gap-2">
        <div className="relative h-4 flex-1 flex flex-col items-center">
            <LargeHandle type="target" position={Position.Left} id="true_val" className="!bg-cyan-400" data={data} />
            <span className="text-[8px] text-cyan-400 font-black tracking-tighter mt-1">TRUE</span>
        </div>
        <div className="w-px h-6 bg-white/5"></div>
        <div className="relative h-4 flex-1 flex flex-col items-center">
            <LargeHandle type="target" position={Position.Right} id="false_val" className="!bg-pink-400" data={data} />
            <span className="text-[8px] text-pink-400 font-black tracking-tighter mt-1">FALSE</span>
        </div>
      </div>

      <LargeHandle type="source" position={Position.Bottom} id="val" className="!bg-white" />
    </NodeShell>
  );
};

export const PlayerNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    return (
      <NodeShell title="Agent Action" id={id} colorClass="border-green-500" selected={selected} data={data}>
        <div className="flex flex-col gap-3">
          <input 
              className="bg-gray-800 text-white text-[10px] p-2 rounded border border-gray-700 focus:border-green-500 transition-colors outline-none" 
              value={data.label} 
              onChange={(e) => updateNodeData(id, { label: e.target.value })}
              placeholder="Action Name..."
          />
          <label className="flex items-center gap-3 p-1.5 rounded bg-black/20 text-[10px] text-green-300 cursor-pointer hover:bg-black/40 transition-colors">
             <input 
                type="checkbox" 
                className="w-3 h-3 accent-green-500"
                checked={data.isAction} 
                onChange={(e) => updateNodeData(id, { isAction: e.target.checked })}
             />
             <span className="font-bold tracking-tight">ACTUATOR SPACE</span>
          </label>
        </div>
        <LargeHandle type="source" position={Position.Bottom} id="val" className="!bg-green-400" />
      </NodeShell>
    );
  };

export const ObjectNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    return (
      <NodeShell title="Env Object" id={id} colorClass="border-yellow-500" selected={selected} data={data}>
        <div className="flex flex-col gap-3">
            <input 
                className="bg-gray-800 text-white text-[10px] p-2 rounded border border-gray-700 focus:border-yellow-500 transition-colors outline-none" 
                value={data.label} 
                onChange={(e) => updateNodeData(id, { label: e.target.value })}
                placeholder="Sensor name..."
            />
             <label className="flex items-center gap-3 p-1.5 rounded bg-black/20 text-[10px] text-yellow-300 cursor-pointer hover:bg-black/40 transition-colors">
             <input 
                type="checkbox" 
                className="w-3 h-3 accent-yellow-500"
                checked={data.isObservation} 
                onChange={(e) => updateNodeData(id, { isObservation: e.target.checked })}
             />
             <span className="font-bold tracking-tight">OBSERVATION</span>
          </label>
        </div>
        <LargeHandle type="source" position={Position.Bottom} id="val" className="!bg-yellow-400" />
      </NodeShell>
    );
};

export const RewardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
    return (
      <NodeShell title="Reward" id={id} colorClass="border-red-500" selected={selected} data={data}>
        <LargeHandle type="target" position={Position.Top} id="input" className="!bg-red-400" data={data} />
        <div className="text-[10px] text-gray-400 font-medium py-2">
           Output Step Reward to Optimizer
        </div>
      </NodeShell>
    );
};

export const nodeTypes = {
  [NodeType.MATH]: MathNode,
  [NodeType.PLAYER]: PlayerNode,
  [NodeType.OBJECT]: ObjectNode,
  [NodeType.REWARD]: RewardNode,
  [NodeType.COMPARE]: CompareNode,
  [NodeType.IF_ELSE]: IfElseNode,
};
