import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { analyzeTrainingData } from '../services/geminiService';

const AnalyticsPanel = () => {
  const trainingData = useStore(state => state.trainingData);
  const isConnected = useStore(state => state.isConnected);
  const generatedCode = useStore(state => state.generatedCode);
  const generateCode = useStore(state => state.generateCode);
  
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Auto-scroll logic or simple periodic analysis could go here
  
  const handleGetInsight = async () => {
    setIsLoadingInsight(true);
    const result = await analyzeTrainingData(trainingData);
    setInsight(result);
    setIsLoadingInsight(false);
  };

  const handleExport = () => {
    generateCode();
    // In a real app, this would trigger a ZIP download
    alert("Python Code generated! Check the 'Code View' tab.");
  };

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-full shadow-2xl z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            System Analytics
        </h2>
        <p className="text-xs text-gray-400 mt-1">
            Status: {isConnected ? 'Streaming Data' : 'Disconnected'}
        </p>
      </div>

      {/* Chart Section */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Reward History</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="episode" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="reward" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* LLM Insight Section */}
        <div className="bg-gradient-to-br from-indigo-900 to-gray-900 rounded-lg p-4 border border-indigo-500/30">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-indigo-300">AI Architect Insight</h3>
                <button 
                    onClick={handleGetInsight}
                    disabled={isLoadingInsight || trainingData.length === 0}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-white disabled:opacity-50 transition-colors"
                >
                    {isLoadingInsight ? 'Analyzing...' : 'Analyze Now'}
                </button>
            </div>
            <div className="text-xs text-gray-300 leading-relaxed min-h-[80px] bg-black/20 p-2 rounded">
                {insight || "Waiting for training data to analyze..."}
            </div>
        </div>

        {/* Code Preview (Mini) */}
        {generatedCode && (
             <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <h3 className="text-sm font-semibold text-green-400 mb-2">Generated Gym Env</h3>
                <pre className="text-[10px] text-gray-400 overflow-x-auto h-32 p-2 bg-black rounded custom-scrollbar">
                    {generatedCode}
                </pre>
             </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="p-4 border-t border-gray-700 bg-gray-900 flex gap-2">
         <button 
            onClick={handleExport}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-all text-sm"
         >
            Export Logic (Python)
         </button>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
