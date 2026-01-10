
import { AppNode, AppEdge, NodeType } from '../types';

export const generatePythonGymEnv = (nodes: AppNode[], edges: AppEdge[]): string => {
  const actionNodes = nodes.filter(n => n.type === NodeType.UI_ACTION || n.type === NodeType.UI_NAV);
  const stateNodes = nodes.filter(n => n.type === NodeType.UI_STATE || n.type === NodeType.UI_MEDIA);
  
  const getSourceNodes = (targetId: string, handleId: string) => {
    const matchingEdges = edges.filter(e => e.target === targetId && (e.targetHandle === handleId || !handleId));
    return matchingEdges.map(edge => nodes.find(n => n.id === edge.source)).filter(Boolean) as AppNode[];
  };

  const getCleanName = (node: AppNode) => {
    const base = node.data.customName || node.data.variableName || node.id;
    return base.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  };

  let code = `
# NeuroFlow Auto-Generated Logic Engine
# Version: 2.3 (Enhanced Node Naming)
import numpy as np

class NeuroFlowEnv:
    def __init__(self):
        # UI State Variables (Mapped from Graph)
`;

  stateNodes.forEach(n => {
    code += `        self.${getCleanName(n)} = ${n.data.value || 0.0}  # ${n.data.purpose || 'Logic state'}\n`;
  });

  code += `\n    def get_state(self):\n        return {\n`;
  stateNodes.forEach(n => {
    const name = getCleanName(n);
    code += `            "${name}": self.${name},\n`;
  });
  code += `        }\n\n`;

  // Helper to generate recursive logic for a node
  const generateNodeLogic = (nodeId: string, depth: number = 2): string => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return "";
    
    const indent = "    ".repeat(depth);
    let logic = "";

    if (node.type === NodeType.IF_ELSE) {
      const inputSrcs = getSourceNodes(node.id, 'input_val');
      const inputVar = inputSrcs.length > 0 ? getCleanName(inputSrcs[0]) : "None";
      
      const cases = node.data.cases || [];
      cases.forEach((c, idx) => {
        const condition = idx === 0 ? "if" : "elif";
        logic += `${indent}${condition} ${inputVar} == ${c.value}:\n`;
        
        const targetEdges = edges.filter(e => e.source === node.id && e.sourceHandle === `case_out_${idx}`);
        if (targetEdges.length > 0) {
            targetEdges.forEach(te => {
                logic += generateNodeLogic(te.target, depth + 1);
            });
        } else {
            logic += `${indent}    pass\n`;
        }
      });
      
      logic += `${indent}else:\n`;
      const defaultEdges = edges.filter(e => e.source === node.id && e.sourceHandle === 'default_branch');
      if (defaultEdges.length > 0) {
          defaultEdges.forEach(de => {
              logic += generateNodeLogic(de.target, depth + 1);
          });
      } else {
          logic += `${indent}    pass\n`;
      }
    } else if (node.type === NodeType.UI_STATE) {
        const setSrcs = getSourceNodes(node.id, 'set_value');
        if (setSrcs.length > 0) {
            const sumStr = setSrcs.map(s => getCleanName(s)).join(' + ');
            logic += `${indent}self.${getCleanName(node)} = ${sumStr}\n`;
        }
    }

    return logic;
  };

  // Generate Event Handlers for Action Buttons
  actionNodes.forEach(n => {
    code += `    def on_${getCleanName(n)}_trigger(self):\n`;
    code += `        """ Logic triggered by ${n.data.customName || n.data.label} """\n`;
    
    const outgoingEdges = edges.filter(e => e.source === n.id);
    if (outgoingEdges.length === 0) {
        code += `        pass\n\n`;
    } else {
        outgoingEdges.forEach(e => {
            code += generateNodeLogic(e.target);
        });
        code += `\n`;
    }
  });

  return code;
};
