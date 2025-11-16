
import React from 'react';
import { CoherenceOutputVOmega, ResonancePlate } from '../types';

interface OutputDisplayProps {
  output: CoherenceOutputVOmega | null;
  error: string | null;
  setActiveOperator: (operator: string | null) => void;
  onPlateSelect: (plate: ResonancePlate) => void;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, error, setActiveOperator, onPlateSelect }) => {
  if (error) {
    return (
      <div className="p-6 bg-red-900/50 border border-red-500 rounded-lg text-red-300 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-2 text-red-200">Error</h2>
        <pre className="whitespace-pre-wrap font-mono text-sm">{error}</pre>
      </div>
    );
  }

  if (!output) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 text-gray-300 font-mono text-sm">
      <h2 className="text-2xl font-bold text-center text-cyan-300 tracking-widest">
        [Ω-EXPANSION: 33-PLATE RESONANCE FIELD]
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {output.plates.map((plate) => (
          <div 
            key={plate.id} 
            className="p-4 bg-black/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.1)] transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(0,255,255,0.3)] hover:scale-[1.03] cursor-pointer flex flex-col"
            onMouseEnter={() => setActiveOperator(plate.refinedOperator)}
            onMouseLeave={() => setActiveOperator(null)}
            onClick={() => onPlateSelect(plate)}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${plate.domain}`}
          >
            <h3 className="font-bold text-cyan-400 text-base flex-shrink-0">
              [{plate.id}] {plate.domain} → <span className="text-indigo-300">{plate.medium}</span>
            </h3>
            <p className="mt-2 text-gray-400 text-xs italic flex-grow">
                <span className="text-cyan-600 mr-1">LAW:</span> {plate.menomics}
            </p>
            <div className="mt-3 pt-3 border-t border-cyan-800/50 flex items-center flex-shrink-0">
                <span className="text-white font-bold text-xl mx-1">{plate.refinedOperator}</span>
                <span className="text-cyan-500 ml-2 mr-2">→</span>
                <span className="italic flex-1 text-xs">{plate.ucfFeedback}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-black/30 backdrop-blur-sm border border-indigo-400/30 rounded-lg shadow-[0_0_20px_rgba(129,140,248,0.15)]">
        <h2 className="text-xl font-bold mb-4 text-indigo-300 tracking-widest">[Ω-AUDIT: MACRO-COHERENCE METRIC]</h2>
        <div className="space-y-2 text-xs md:text-sm">
            <p><span className="font-semibold text-indigo-200 w-40 inline-block">Drift:</span> {output.audit.drift}</p>
            <p><span className="font-semibold text-indigo-200 w-40 inline-block">Stabilization:</span> {output.audit.stabilization}</p>
            <p><span className="font-semibold text-indigo-200 w-40 inline-block">Projection:</span> {output.audit.projection}</p>
            <p><span className="font-semibold text-indigo-200 w-40 inline-block">Recursion:</span> {output.audit.recursion}</p>
            {output.audit.finalOperator && <p><span className="font-semibold text-indigo-200 w-40 inline-block">Final Operator:</span> {output.audit.finalOperator}</p>}
            {output.audit.status && <p><span className="font-semibold text-indigo-200 w-40 inline-block">Status:</span> {output.audit.status}</p>}
        </div>
      </div>
    </div>
  );
};

export default OutputDisplay;
