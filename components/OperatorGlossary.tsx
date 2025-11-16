import React from 'react';
import type { ResonancePlate } from '../types';

interface OperatorGlossaryProps {
  isOpen: boolean;
  plates: ResonancePlate[];
  descriptions: Record<string, string> | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const OperatorGlossary: React.FC<OperatorGlossaryProps> = ({ isOpen, plates, descriptions, isLoading, error, onClose }) => {
  if (!isOpen) {
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
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#010413] to-[#05000a] border border-indigo-400/30 rounded-lg shadow-2xl shadow-indigo-500/20 overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close glossary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pr-8">
            <h2 className="text-2xl font-bold text-indigo-300 tracking-widest mb-8">
                [REFINED OPERATOR GLOSSARY]
            </h2>
            
            {plates && plates.length > 0 ? (
                <div className="space-y-8">
                    {plates.map((plate) => {
                        const description = descriptions?.[plate.refinedOperator];
                        return (
                           <div key={plate.id} className="border-b border-indigo-800/50 pb-8 last:border-b-0 last:pb-0">
                                <div className="flex items-start gap-x-6">
                                    <div className="text-5xl font-mono text-cyan-300 pt-1">
                                        {plate.refinedOperator}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="min-h-[2.5rem]"> {/* Prevents layout shift on load */}
                                            {isLoading && !description && (
                                                <p className="italic text-indigo-300/70 animate-pulse text-lg leading-relaxed">Generating description...</p>
                                            )}
                                            {error && !description && (
                                                <p className="italic text-red-400/80 text-lg leading-relaxed">Description failed to load.</p>
                                            )}
                                            {description && (
                                                <p className="italic text-cyan-100 text-lg leading-relaxed">"{description}"</p>
                                            )}
                                        </div>

                                        <div className="mt-4 text-sm space-y-2 text-gray-400 border-t border-indigo-700/50 pt-4">
                                            <p><strong className="text-indigo-300 font-semibold w-32 inline-block">Origin Domain:</strong> {plate.domain}</p>
                                            <p className="flex items-start"><strong className="text-indigo-300 font-semibold w-32 inline-block shrink-0">Impact on UCF:</strong> <span className="italic flex-1">"{plate.ucfFeedback}"</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : <p className="text-gray-400 italic">No operator data available.</p>}
        </div>
      </div>
    </div>
  );
};

export default OperatorGlossary;
