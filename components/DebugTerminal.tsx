import React, { useState } from 'react';
import { useStore } from '../store';

const DebugTerminal = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { debugLogs, clearLogs } = useStore();

  return (
    <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'translate-y-[calc(100%-2.5rem)]' : 'translate-y-0'}`}>
      {/* Header / Tab */}
      <div 
        className="bg-gray-900 border-t border-x border-gray-700 rounded-t-lg h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
             <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Debug Terminal</span>
          </div>
          <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
            {debugLogs.length} events
          </span>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={(e) => { e.stopPropagation(); clearLogs(); }}
             className="text-[9px] text-gray-500 hover:text-red-400 transition-colors uppercase font-bold"
           >
             Clear
           </button>
           <svg 
             xmlns="http://www.w3.org/2000/svg" 
             className={`h-4 w-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} 
             fill="none" viewBox="0 0 24 24" stroke="currentColor"
           >
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
           </svg>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-950/95 backdrop-blur-xl border-x border-gray-700 h-48 overflow-y-auto p-4 font-mono text-[11px] custom-scrollbar shadow-2xl">
        {debugLogs.length === 0 ? (
          <div className="text-gray-600 italic">No logs generated yet. Ready for simulation...</div>
        ) : (
          debugLogs.map((log) => (
            <div key={log.id} className="flex gap-3 mb-1.5 group border-b border-white/5 pb-1">
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span className={`font-bold shrink-0 uppercase w-12 ${
                log.type === 'error' ? 'text-red-500' : 
                log.type === 'warning' ? 'text-yellow-500' : 
                log.type === 'success' ? 'text-green-500' : 
                'text-blue-400'
              }`}>
                {log.type}:
              </span>
              <span className="text-gray-300 leading-tight">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugTerminal;
