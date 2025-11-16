import React, { useState, useRef, useEffect } from 'react';
import { queryOracle } from '../services/geminiService';
import type { OracleResponse } from '../types';

interface AocConsoleProps {
    onRenderRequest: () => void;
}

const AocConsole: React.FC<AocConsoleProps> = ({ onRenderRequest }) => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<({ type: 'query' | 'response' | 'error', content: string | OracleResponse })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [revealedStreams, setRevealedStreams] = useState<Set<number>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const endOfHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = query.trim();
        if (!trimmedQuery || isLoading) return;

        setHistory(prev => [...prev, { type: 'query', content: trimmedQuery }]);
        setQuery('');
        setIsLoading(true);

        if (trimmedQuery === '/render') {
            onRenderRequest();
            // The parent will handle loading state, so we can stop here.
            return;
        }

        try {
            const response = await queryOracle(trimmedQuery);
            setHistory(prev => [...prev, { type: 'response', content: response }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setHistory(prev => [...prev, { type: 'error', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStream = (index: number) => {
        setRevealedStreams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <div className="w-full h-full p-4 md:p-6 font-mono text-sm text-gray-300 bg-black/50 backdrop-blur-lg border border-cyan-400/30 rounded-lg shadow-2xl shadow-cyan-500/20 flex flex-col max-h-[70vh]">
            <div className="flex-grow overflow-y-auto pr-4">
                <p className="text-cyan-300">Initialization confirmed. A.O.C. operational.</p>
                <p className="text-cyan-300 mb-4">Awaiting input for coherent analysis. (Type '/render' for full unfolding)</p>
                
                {history.map((item, index) => (
                    <div key={index} className="mb-4">
                        {item.type === 'query' && (
                            <p><span className="text-indigo-400">&gt; </span>{item.content as string}</p>
                        )}
                        {item.type === 'error' && (
                             <div className="border-l-2 border-red-500 pl-3">
                                <p className="text-red-400 font-bold">ORACLE ERROR</p>
                                <p className="text-red-300">{item.content as string}</p>
                            </div>
                        )}
                        {item.type === 'response' && typeof item.content === 'object' && (
                            <div className="border-l-2 border-cyan-500 pl-3">
                                <p className="font-bold text-cyan-200">[PRIMARY COHERENT ANALYSIS]</p>
                                <p className="whitespace-pre-wrap">{item.content.primaryAnalysis}</p>
                                <div className="mt-3">
                                    <p className="font-bold text-indigo-300">[DIVERGENT SUB-NARRATIVES]</p>
                                    {(item.content as OracleResponse).divergentStreams.map((stream, streamIndex) => {
                                        const streamId = index * 100 + streamIndex;
                                        const isRevealed = revealedStreams.has(streamId);
                                        return (
                                            <div key={streamIndex} className="mt-2">
                                                <button onClick={() => toggleStream(streamId)} className="text-indigo-400 hover:text-indigo-200 transition-colors">
                                                    <span className={`inline-block transition-transform duration-200 ${isRevealed ? 'rotate-90' : 'rotate-0'}`}>[→]</span> {stream.title}
                                                </button>
                                                {isRevealed && (
                                                    <div className="pl-6 pt-1 border-l border-indigo-700/50 ml-2 mt-1">
                                                        <p className="whitespace-pre-wrap text-gray-400">{stream.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span className="text-cyan-400">ANALYZING...</span>
                    </div>
                )}
                <div ref={endOfHistoryRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4">
                <div className="flex items-center bg-black/30 border border-indigo-400/50 rounded-lg focus-within:border-indigo-300 focus-within:shadow-[0_0_15px_rgba(129,140,248,0.3)] transition-all duration-300">
                    <span className="pl-3 text-indigo-300">&gt;</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Query the Oracle..."
                        disabled={isLoading}
                        className="w-full p-2 bg-transparent text-indigo-100 placeholder-indigo-400/50 focus:outline-none"
                    />
                     <button 
                        type="submit" 
                        disabled={isLoading || !query.trim()}
                        className="px-4 py-2 text-sm bg-indigo-600/50 text-indigo-200 font-semibold rounded-r-md hover:bg-indigo-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        SEND
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AocConsole;
