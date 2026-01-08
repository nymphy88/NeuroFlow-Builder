import { AppNode, AppEdge, NodeType } from '../types';

/**
 * Converts the visual node structure into a Python Class inheriting from gymnasium.Env
 */
export const generatePythonGymEnv = (nodes: AppNode[], edges: AppEdge[]): string => {
  const observations = nodes.filter(n => n.data.isObservation);
  const actions = nodes.filter(n => n.data.isAction);
  
  const getInputs = (nodeId: string) => {
    // Return an object mapping handle ID to source variable name
    const inputMap: Record<string, string> = {};
    edges
      .filter(e => e.target === nodeId)
      .forEach(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        if (sourceNode) {
          inputMap[e.targetHandle || 'val'] = sourceNode.data.variableName || '0';
        }
      });
    return inputMap;
  };

  const logicProcessingNodes = nodes.filter(n => 
    [NodeType.MATH, NodeType.LOGIC, NodeType.COMPARE, NodeType.IF_ELSE].includes(n.type as NodeType)
  );
  const rewardNode = nodes.find(n => n.type === NodeType.REWARD);

  let code = `
import gymnasium as gym
import numpy as np
from gymnasium import spaces

class CustomLogicEnv(gym.Env):
    """
    Auto-generated Environment from NeuroFlow Builder.
    """
    def __init__(self):
        super(CustomLogicEnv, self).__init__()

        # Define Action Space (Continuous)
        self.action_space = spaces.Box(low=-1, high=1, shape=(${actions.length},), dtype=np.float32)

        # Define Observation Space
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(${observations.length},), dtype=np.float32)

        # Initialize State Variables
`;

  nodes.forEach(n => {
    if (n.data.variableName) {
      code += `        self.${n.data.variableName} = ${n.data.value || 0.0}\n`;
    }
  });

  code += `
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        # Reset Logic
`;
    nodes.filter(n => n.type === NodeType.OBJECT || n.type === NodeType.PLAYER).forEach(n => {
       code += `        self.${n.data.variableName} = ${n.data.value || 0.0}\n`; 
    });

  code += `        return self._get_obs(), {}

    def _get_obs(self):
        return np.array([
            ${observations.map(n => `self.${n.data.variableName}`).join(',\n            ')}
        ], dtype=np.float32)

    def step(self, action):
        # 1. Apply Actions
`;

  actions.forEach((n, index) => {
     code += `        self.${n.data.variableName} += action[${index}] # Update ${n.data.label}\n`;
  });

  code += `\n        # 2. Execute Logic Flow\n`;

  // Iterative logic processing
  logicProcessingNodes.forEach(node => {
    const inputs = getInputs(node.id);
    const varName = `self.${node.data.variableName}`;
    const op = node.data.operation || '+';
    
    if (node.type === NodeType.MATH) {
        const a = inputs['a'] ? `self.${inputs['a']}` : '0';
        const b = inputs['b'] ? `self.${inputs['b']}` : '0';
        if (op === '+') code += `        ${varName} = ${a} + ${b}\n`;
        if (op === '-') code += `        ${varName} = ${a} - ${b}\n`;
        if (op === '*') code += `        ${varName} = ${a} * ${b}\n`;
        if (op === '/') code += `        ${varName} = ${a} / (${b} + 1e-6)\n`;
    } else if (node.type === NodeType.COMPARE) {
        const a = inputs['a'] ? `self.${inputs['a']}` : '0';
        const b = inputs['b'] ? `self.${inputs['b']}` : '0';
        code += `        ${varName} = 1.0 if ${a} ${op} ${b} else 0.0\n`;
    } else if (node.type === NodeType.IF_ELSE) {
        const cond = inputs['condition'] ? `self.${inputs['condition']}` : '0';
        const tVal = inputs['true_val'] ? `self.${inputs['true_val']}` : '1.0';
        const fVal = inputs['false_val'] ? `self.${inputs['false_val']}` : '0.0';
        code += `        ${varName} = ${tVal} if ${cond} > 0.5 else ${fVal}\n`;
    }
  });

  code += `\n        # 3. Calculate Reward\n`;
  if (rewardNode) {
      const inputs = getInputs(rewardNode.id);
      const inputVar = inputs['input'] ? `self.${inputs['input']}` : '0';
      code += `        reward = ${inputVar}\n`;
  } else {
      code += `        reward = 0.0\n`;
  }

  code += `
        # 4. Check Termination
        # Auto-termination example: if agent too far
        terminated = False
        truncated = False
        
        # 5. Return Step
        return self._get_obs(), float(reward), terminated, truncated, {}
`;

  return code;
};
