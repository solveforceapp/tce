import React from 'react';
import type { ResonancePlate } from '../types';

interface PlateDetailModalProps {
  isOpen: boolean;
  plate: ResonancePlate | null;
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-sm font-bold tracking-widest text-cyan-300 uppercase mb-2 border-b border-cyan-700/50 pb-1">
      {title}
    </h4>
    <div className="text-gray-300 text-sm prose prose-sm prose-invert max-w-none prose-p:my-1 prose-pre:bg-cyan-900/20 prose-pre:p-3 prose-pre:rounded-md prose-pre:whitespace-pre-wrap">
        {children}
    </div>
  </div>
);

const PlateDetailModal: React.FC<PlateDetailModalProps> = ({ isOpen, plate, onClose }) => {
  if (!isOpen || !plate) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#010413] to-[#05000a] border border-cyan-400/30 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-y-auto p-6 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pr-8">
            <h2 className="text-2xl font-bold text-cyan-300">
              [{plate.id}] {plate.domain}
            </h2>
            <p className="text-indigo-300 mb-4">Medium: {plate.medium}</p>

            <div className="mt-6 pt-4 border-t-2 border-indigo-500/30">
                <h3 className="text-lg font-bold text-indigo-300 mb-4 tracking-widest">FULL SEQUENTIAL UNFOLDING</h3>
                
                <DetailSection title="Input Glyph">
                    <p>{plate.inputGlyph}</p>
                </DetailSection>

                <DetailSection title="Transduction Chain">
                    <pre>{plate.transductionChain}</pre>
                </DetailSection>

                <DetailSection title="Output Law (MENOMICS)">
                     <p className="italic text-white">"{plate.menomics}"</p>
                </DetailSection>

                <DetailSection title="Refined Operator">
                  <div className="flex items-center">
                    <strong className="text-3xl font-mono text-white mr-4">{plate.refinedOperator}</strong>
                    <span className="text-indigo-200">{plate.refinedOperatorDescription}</span>
                  </div>
                </DetailSection>

                <DetailSection title="UCF Feedback">
                    <p>{plate.ucfFeedback}</p>
                </DetailSection>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PlateDetailModal;
