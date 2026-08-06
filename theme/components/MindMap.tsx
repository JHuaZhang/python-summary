import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { KNOWLEDGE_DATA, type KnowledgeItem } from '../data/knowledge-data';

interface KnowledgeNodeData extends KnowledgeItem {
  collapsed?: boolean;
  toggleCollapse?: () => void;
}

function KnowledgeNode({ data }: NodeProps<KnowledgeNodeData>) {
  // 节点类型判断
  const isModuleRoot = data.parentId === null; // Shell / Linux / Nginx / Docker
  const isGroupNode = !data.link && !data.fontSize && data.parentId !== null; // 【01】xxx基础入门 等

  return (
    <div
      style={{
        padding: '6px 14px',
        borderRadius: isModuleRoot ? '18px' : data.link ? '12px' : '8px',
        background: data.bg || '#fff',
        border: `1.5px solid ${data.color || '#e8e8e8'}`,
        color: data.color || '#555',
        fontSize: data.fontSize || 12,
        fontWeight: data.fontSize ? 600 : data.link ? 400 : 500,
        cursor: data.link || isGroupNode ? 'pointer' : 'default',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        boxShadow: data.fontSize ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
        userSelect: 'none',
      }}
      onClick={() => {
        if (data.link) {
          const base =
            document.querySelector('.rp-nav__title__link')?.getAttribute('href') ?? '/';
          window.location.href = base.replace(/\/$/, '') + data.link + '.html';
        } else if (isGroupNode && data.toggleCollapse) {
          data.toggleCollapse();
        }
      }}
      title={
        data.link ? '点击进入文章' : isGroupNode ? '点击展开 / 折叠' : ''
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: data.color, opacity: 0 }}
      />
      {isGroupNode && (
        <span style={{ marginRight: 6, fontSize: 11, opacity: 0.7 }}>
          {data.collapsed ? '▶' : '▼'}
        </span>
      )}
      {data.label}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: data.color, opacity: 0 }}
      />
    </div>
  );
}

const nodeTypes = { knowledgeNode: KnowledgeNode };

/**
 * 为一个模块的所有数据计算 dagre 布局，并返回节点/边/模块宽度
 */
function computeModuleLayout(
  moduleItems: KnowledgeItem[],
  collapsedGroups: Set<string>,
  offsetX: number,
) {
  // 过滤掉被折叠 group 的子节点
  const visibleItems = moduleItems.filter((item) => {
    if (item.link && collapsedGroups.has(item.parentId!)) return false;
    return true;
  });

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 80, marginx: 40, marginy: 40 });

  visibleItems.forEach((n) => {
    const w = n.label.length * (n.fontSize ? 10 : 9) + 40;
    g.setNode(n.id, { width: w, height: n.fontSize ? 36 : 30 });
  });

  visibleItems.forEach((n) => {
    if (n.parentId) g.setEdge(n.parentId, n.id);
  });

  dagre.layout(g);

  const nodes = visibleItems.map((n) => {
    const pos = g.node(n.id);
    const w = n.label.length * (n.fontSize ? 10 : 9) + 40;
    const isGroup = n.parentId !== null && !n.link && !n.fontSize;
    return {
      id: n.id,
      type: 'knowledgeNode' as const,
      position: {
        x: pos.x - w / 2 + offsetX,
        y: pos.y - (n.fontSize ? 18 : 15),
      },
      data: {
        ...n,
        collapsed: isGroup ? collapsedGroups.has(n.id) : undefined,
        _isToggleTarget: isGroup,
      },
    };
  });

  const edges = visibleItems
    .filter((n) => n.parentId)
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: 'smoothstep' as const,
      style: { stroke: '#d9d9d9', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed as const,
        color: '#d9d9d9',
        width: 14,
        height: 14,
      },
    }));

  const modWidth = g.graph().width || 400;
  return { nodes, edges, modWidth };
}

export default function MindMap() {
  // 按模块根节点分组（parentId === null），保留 KNOWLEDGE_DATA 原有次序（即 nav.order 排序）
  const modules = useMemo(() => {
    const roots = KNOWLEDGE_DATA.filter((n) => n.parentId === null);
    const result: { root: KnowledgeItem; items: KnowledgeItem[] }[] = [];
    for (const root of roots) {
      const items: KnowledgeItem[] = [root];
      const collect = (parentId: string) => {
        for (const n of KNOWLEDGE_DATA) {
          if (n.parentId === parentId) {
            items.push(n);
            collect(n.id);
          }
        }
      };
      collect(root.id);
      result.push({ root, items });
    }
    return result;
  }, []);

  // 默认所有 group 节点折叠（只显示到 【01】xxx基础入门 层级）
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    KNOWLEDGE_DATA.forEach((item) => {
      if (!item.link && !item.fontSize && item.parentId !== null) {
        initial.add(item.id);
      }
    });
    return initial;
  });

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  // 用 Set 序列化作为 useMemo 依赖
  const collapseKey = useMemo(
    () => [...collapsedGroups].sort().join(','),
    [collapsedGroups],
  );

  // 计算所有模块的布局
  const layoutResult = useMemo(() => {
    let currentOffsetX = 0;
    let allNodes: any[] = [];
    let allEdges: any[] = [];

    for (const mod of modules) {
      const { nodes, edges, modWidth } = computeModuleLayout(
        mod.items,
        collapsedGroups,
        currentOffsetX,
      );
      allNodes = allNodes.concat(nodes);
      allEdges = allEdges.concat(edges);
      currentOffsetX += modWidth + 120; // 模块间 120px 间距
    }

    return { nodes: allNodes, edges: allEdges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseKey, modules]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // layout 变化时更新，同时注入 toggleCollapse
  useEffect(() => {
    const nodesWithToggle = layoutResult.nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        toggleCollapse: n.data._isToggleTarget
          ? () => toggleCollapse(n.id)
          : undefined,
      },
    }));
    setNodes(nodesWithToggle);
    setEdges(layoutResult.edges);
  }, [layoutResult, toggleCollapse, setNodes, setEdges]);

  return (
    <ReactFlowProvider>
      <div
        style={{
          width: '100%',
          height: 'calc(100vh - 200px)',
          border: '1px solid #eee',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#fcfcfc',
          marginTop: '40px',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={2}
          panOnDrag
          zoomOnScroll
          nodesDraggable
          fitViewOptions={{ padding: 0.2 }}
        >
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor="#ddd"
            nodeColor="#e6f4ff"
            nodeBorderRadius={4}
            style={{ border: '1px solid #eee', borderRadius: '6px' }}
          />
          <Background color="#f0f0f0" gap={20} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
