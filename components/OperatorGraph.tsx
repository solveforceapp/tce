import React, { useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ResonancePlate } from '../types';

interface OperatorGraphProps {
  isOpen: boolean;
  plates: ResonancePlate[];
  onClose: () => void;
}

const DetailPanel: React.FC<{ plate: ResonancePlate, onClose: () => void }> = ({ plate, onClose }) => (
    <div 
        className="absolute top-4 right-4 w-full max-w-md max-h-[calc(100%-2rem)] bg-black/50 backdrop-blur-lg border border-cyan-400/30 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-y-auto p-6 animate-slide-in"
        onClick={(e) => e.stopPropagation()}
    >
        <style>{`
            @keyframes slide-in {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
        `}</style>
         <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-cyan-300 pr-8">
            [{plate.id}] {plate.domain}
        </h2>
        <p className="text-indigo-300 mb-4 text-sm">Medium: {plate.medium}</p>

        <div className="mt-4 pt-4 border-t-2 border-indigo-500/30 text-sm space-y-3">
             <div>
                <h4 className="font-bold tracking-widest text-cyan-400/80 uppercase text-xs mb-1">Input Glyph</h4>
                <p className="font-mono text-cyan-200 bg-cyan-900/20 px-2 py-1 rounded-md inline-block">{plate.inputGlyph}</p>
             </div>
             <div>
                <h4 className="font-bold tracking-widest text-cyan-400/80 uppercase text-xs mb-1">Transduction Chain</h4>
                <p className="font-mono text-gray-300 text-xs">{plate.transductionChain}</p>
             </div>
             <div>
                <h4 className="font-bold tracking-widest text-cyan-400/80 uppercase text-xs mb-1">Output Law</h4>
                <p className="italic text-white">"{plate.menomics}"</p>
             </div>
             <div>
                <h4 className="font-bold tracking-widest text-cyan-400/80 uppercase text-xs mb-1">UCF Feedback</h4>
                <p className="italic text-gray-300">"{plate.ucfFeedback}"</p>
             </div>
        </div>
    </div>
);


const OperatorGraph: React.FC<OperatorGraphProps> = ({ isOpen, plates, onClose }) => {
    const [selectedNode, setSelectedNode] = useState<ResonancePlate | null>(null);

    const { nodes, links } = useMemo(() => {
        if (!plates) return { nodes: [], links: [] };
        const graphNodes = plates.map(p => ({
            id: p.id,
            ...p,
        }));
        const graphLinks = plates.slice(0, -1).map(p => ({
            source: p.id,
            target: p.id + 1,
        }));
        return { nodes: graphNodes, links: graphLinks };
    }, [plates]);

    const neighbors = useMemo(() => {
        if (!selectedNode) return new Set();
        const adjacentNodes = new Set<number>();
        links.forEach(link => {
            if (link.source === selectedNode.id) {
                adjacentNodes.add(link.target);
            }
            if (link.target === selectedNode.id) {
                adjacentNodes.add(link.source);
            }
        });
        return adjacentNodes;
    }, [selectedNode, links]);
    
    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node);
    }, []);

    const handleBackgroundClick = useCallback(() => {
        setSelectedNode(null);
    }, []);
    
    const handleNodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.refinedOperator;
        const radius = 12;
        const fontSize = 16 / globalScale;

        const isSelected = selectedNode?.id === node.id;
        const isNeighbor = neighbors.has(node.id);
        
        const pulse = isSelected ? Math.abs(Math.sin(Date.now() / 300)) : 0;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + pulse * 4, 0, 2 * Math.PI, false);
        
        if (isSelected) {
            ctx.fillStyle = `rgba(129, 140, 248, 1)`;
            ctx.shadowColor = `rgba(129, 140, 248, 1)`;
            ctx.shadowBlur = 30;
        } else if (isNeighbor) {
            ctx.fillStyle = `rgba(45, 212, 191, 1)`;
            ctx.shadowColor = `rgba(45, 212, 191, 1)`;
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = `rgba(0, 255, 255, 0.6)`;
            ctx.shadowColor = `rgba(0, 255, 255, 0.8)`;
            ctx.shadowBlur = 15;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(label, node.x, node.y);
    }, [selectedNode, neighbors]);

    const handleLinkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
        const isHighlighted = selectedNode &&
            (link.source.id === selectedNode.id || link.target.id === selectedNode.id);
        
        ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
        
        const start = link.source;
        const end = link.target;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }, [selectedNode]);

    if (!isOpen) {
        return null;
    }

    return (
    <div
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors z-50 bg-black/30 rounded-full p-2"
          aria-label="Close graph"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <ForceGraph2D
            graphData={{ nodes, links }}
            nodeLabel="domain"
            nodeCanvasObject={handleNodeCanvasObject}
            linkCanvasObject={handleLinkCanvasObject}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={100}
            onEngineStop={(fg: any) => fg.zoomToFit(400, 100)}
        />

        {selectedNode && <DetailPanel plate={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
    );
};

export default OperatorGraph;