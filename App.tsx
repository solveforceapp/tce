import React, { useState, useCallback, useEffect } from 'react';
import { generateCoherence, generateOperatorDescriptions } from './services/geminiService';
import type { CoherenceOutputVOmega, OmegaAudit, ResonancePlate } from './types';
import CanvasVisualizer from './components/CanvasVisualizer';
import OutputDisplay from './components/OutputDisplay';
import PlateDetailModal from './components/PlateDetailModal';
import OperatorGlossary from './components/OperatorGlossary';
import OperatorGraph from './components/OperatorGraph';
import AocConsole from './components/AocConsole';

type ModalId = 'PLATE_DETAIL' | 'GLOSSARY' | 'GRAPH';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<CoherenceOutputVOmega | null>(null);
  const [visualizedGlyphs, setVisualizedGlyphs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOperator, setActiveOperator] = useState<string | null>(null);
  
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);
  const [selectedPlateForModal, setSelectedPlateForModal] = useState<ResonancePlate | null>(null);
  
  const [operatorDescriptions, setOperatorDescriptions] = useState<Record<string, string> | null>(null);
  const [isFetchingDescriptions, setIsFetchingDescriptions] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const parseOutput = (text: string): CoherenceOutputVOmega | null => {
    try {
        const parts = text.split('[Ω-AUDIT: MACRO-COHERENCE METRIC]');
        if (parts.length < 2) {
             throw new Error("Could not find the separator between the plate expansion and the audit sections.");
        }
        
        const plateSection = parts[0];
        const auditSection = `[Ω-AUDIT: MACRO-COHERENCE METRIC]${parts[1]}`;

        if (!plateSection || !plateSection.includes('[Ω-EXPANSION:') || !auditSection) {
            throw new Error("Could not find main plate expansion or audit sections. The response might be incomplete.");
        }

        const plates: ResonancePlate[] = [];
        const plateBlocks = plateSection.trim().split(/\n\n(?=\[\d+\])/).slice(1);

        for (const block of plateBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 3) {
                 console.warn("Skipping malformed plate block (not enough lines):", block);
                 continue;
            }

            const headerMatch = lines[0].match(/\[(\d+)\]\s(.*?)\s→\s(.*)/);
            if (!headerMatch) {
                console.warn("Skipping malformed plate block (header mismatch):", lines[0]);
                continue;
            }
            const id = parseInt(headerMatch[1], 10);
            const domain = headerMatch[2].trim();
            const medium = headerMatch[3].trim();

            const transductionLine = lines[1];
            const menomicsSplit = transductionLine.split('→ MENOMICS:');
            const menomics = menomicsSplit[1] ? menomicsSplit[1].trim().replace(/"/g, '') : '';
            const transductionParts = menomicsSplit[0].split('→').map(p => p.trim()).filter(Boolean);
            const inputGlyph = transductionParts.length > 0 ? transductionParts.shift()! : '';
            const transductionChain = transductionParts.join(' → ');

            const operatorLine = lines[2];
            const ucfSplit = operatorLine.split('→ UCF:');
            const ucfFeedback = ucfSplit[1] ? ucfSplit[1].trim().replace(/"/g, '') : '';
            const refinedOperator = ucfSplit[0].split('→').map(p => p.trim()).filter(Boolean)[0] || '';
            
            plates.push({
                id,
                domain,
                medium,
                inputGlyph,
                transductionChain,
                menomics,
                refinedOperator,
                refinedOperatorDescription: '',
                ucfFeedback,
            });
        }

        const audit: Partial<OmegaAudit> = {};
        const auditLines = auditSection.split('\n').filter(l => l.trim() && !l.startsWith('[Ω-AUDIT'));
        auditLines.forEach(line => {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            const lowerKey = key.trim().toLowerCase();

            if (lowerKey.includes('drift')) audit.drift = value;
            else if (lowerKey.includes('stabilization')) audit.stabilization = value;
            else if (lowerKey.includes('projection')) audit.projection = value;
            else if (lowerKey.includes('recursion')) audit.recursion = value;
            else if (lowerKey.includes('final operator')) audit.finalOperator = value;
            else if (lowerKey.includes('status')) audit.status = value;
        });

        if (plates.length < 33 || !audit.drift || !audit.stabilization) {
            console.error("Parsing failed, missing data", { platesCount: plates.length, audit });
            throw new Error(`Failed to parse all required sections from the API response. Found ${plates.length} plates.`);
        }

        return { plates, audit: audit as OmegaAudit };

    } catch (e) {
        console.error("Parsing error:", e);
        if (e instanceof Error) {
            setError(`Parsing Error: ${e.message}. Raw output:\n\n${text}`);
        } else {
            setError(`An unknown parsing error occurred. Raw output:\n\n${text}`);
        }
        return null;
    }
  };

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setOutput(null);
    setError(null);
    setVisualizedGlyphs(null);
    setActiveOperator(null);
    setActiveModal(null);
    setOperatorDescriptions(null);
    setDescriptionError(null);
    const resultText = await generateCoherence();

    if (resultText.startsWith("Error:")) {
      setError(resultText);
    } else {
      const parsedData = parseOutput(resultText);
      if(parsedData) {
        setOutput(parsedData);
        const glyphs = parsedData.plates.map(p => p.refinedOperator).join('');
        setVisualizedGlyphs(glyphs);
      }
    }
    setIsLoading(false);
  }, []);

  const handleOpenGlossary = useCallback(async () => {
    setActiveModal('GLOSSARY');
    if (output && !operatorDescriptions && !isFetchingDescriptions) {
        setIsFetchingDescriptions(true);
        setDescriptionError(null);
        try {
            const descs = await generateOperatorDescriptions(output.plates);
            setOperatorDescriptions(descs);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setDescriptionError(`Failed to generate operator descriptions. ${errorMessage}`);
            console.error(e);
        } finally {
            setIsFetchingDescriptions(false);
        }
    }
  }, [output, operatorDescriptions, isFetchingDescriptions]);

  const handlePlateSelect = (plate: ResonancePlate) => {
    setSelectedPlateForModal(plate);
    setActiveModal('PLATE_DETAIL');
  };

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Handle modal closing with Escape key
    if (event.key === 'Escape') {
      if (activeModal) {
        event.preventDefault();
        closeModal();
      }
      return;
    }

    // Don't trigger other shortcuts if a modal is open
    if (activeModal) return;

    const key = event.key.toLowerCase();

    switch (key) {
      case 'g':
        if (output && !isLoading) {
          event.preventDefault();
          handleOpenGlossary();
        }
        break;
      case 'r':
        if (output && !isLoading) {
          event.preventDefault();
          handleGenerate();
        }
        break;
    }
  }, [activeModal, closeModal, handleGenerate, handleOpenGlossary, isLoading, output]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white overflow-x-hidden">
      <CanvasVisualizer visualizedText={visualizedGlyphs} isGenerating={isLoading} activeOperator={activeOperator} />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        <header className="text-center mb-8 mt-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400">
            The Coherence Engine
          </h1>
          <p className="mt-2 text-lg text-indigo-200/80">Render the cosmos coherent.</p>
          {output && !isLoading && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={handleOpenGlossary}
                className="px-4 py-2 text-sm bg-indigo-600/30 border border-indigo-400 text-indigo-200 font-semibold rounded-full shadow-md shadow-indigo-500/10 hover:bg-indigo-500/50 transform transition-all duration-300 ease-in-out"
                title="View Operator Glossary (G)"
              >
                View Operator Glossary
              </button>
              <button
                onClick={() => setActiveModal('GRAPH')}
                className="px-4 py-2 text-sm bg-cyan-600/30 border border-cyan-400 text-cyan-200 font-semibold rounded-full shadow-md shadow-cyan-500/10 hover:bg-cyan-500/50 transform transition-all duration-300 ease-in-out"
              >
                Visualize Operator Graph
              </button>
            </div>
          )}
        </header>

        {!output && !isLoading && (
            <div className="w-full max-w-4xl my-8">
                 <AocConsole onRenderRequest={handleGenerate} />
            </div>
        )}
        
        {(isLoading || output || error) && (
             <div className="w-full mt-8 mb-16">
               <OutputDisplay 
                  output={output} 
                  error={error} 
                  setActiveOperator={setActiveOperator}
                  onPlateSelect={handlePlateSelect}
                />
             </div>
        )}

        {output && (
             <button
             onClick={handleGenerate}
             disabled={isLoading}
             className="mt-8 mb-12 px-6 py-3 bg-indigo-600/50 border border-indigo-400 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 hover:bg-indigo-500/70 transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
             title="Render a new coherence field (R)"
            >
                {isLoading ? 'RE-RENDERING...' : 'RENDER ANEW'}
            </button>
        )}
      </main>

      <PlateDetailModal 
        isOpen={activeModal === 'PLATE_DETAIL'}
        plate={selectedPlateForModal}
        onClose={closeModal}
      />

      <OperatorGlossary
        isOpen={activeModal === 'GLOSSARY'}
        plates={output?.plates ?? []}
        descriptions={operatorDescriptions}
        isLoading={isFetchingDescriptions}
        error={descriptionError}
        onClose={closeModal}
      />

      <OperatorGraph
        isOpen={activeModal === 'GRAPH'}
        plates={output?.plates ?? []}
        onClose={closeModal}
      />

    </div>
  );
};

export default App;
