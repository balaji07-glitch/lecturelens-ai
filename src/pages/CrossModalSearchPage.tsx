import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Mic,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { searchAcrossLessons } from '../services/api.ts';
import type { SearchResult } from '../types/index.ts';

export const CrossModalSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalityFilter, setModalityFilter] = useState<'all' | 'audio' | 'visual' | 'concept' | 'study_artifact'>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setIsLoading(true);
      setHasSearched(true);
      const res = await searchAcrossLessons(query.trim());
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults =
    modalityFilter === 'all'
      ? results
      : results.filter((r) => r.modality === modalityFilter);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 bg-ambient-glow">
      {/* Search Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-white">Cross-Modal Search Engine</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Search simultaneously across spoken lecture audio, slide diagrams, OCR text, and study artifacts.
        </p>
      </div>

      {/* Search Bar Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, formulas, spoken quotes, e.g., 'Token', 'Collision', 'MAU'..."
            className="w-full glass-input pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 glass-button-primary rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Modality Filter Pills */}
      {results.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          {(['all', 'audio', 'visual', 'concept', 'study_artifact'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setModalityFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                modalityFilter === filter
                  ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/20'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Results Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="glass-panel p-12 text-center text-slate-400">
            <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Querying multimodal indexes...</p>
          </div>
        ) : hasSearched && filteredResults.length === 0 ? (
          <div className="glass-panel p-10 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-white">No cross-modal matches found</p>
            <p className="text-xs text-slate-500">
              Try broader search terms like "token", "ring", "diagram", or "protocol".
            </p>
          </div>
        ) : (
          filteredResults.map((item) => (
            <div
              key={item.id}
              className="glass-card-elevated p-4 sm:p-5 border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                      item.modality === 'audio'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : item.modality === 'visual'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : item.modality === 'concept'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {item.modality === 'audio' && <Mic className="h-3 w-3" />}
                    {item.modality === 'visual' && <ImageIcon className="h-3 w-3" />}
                    {item.modality === 'concept' && <Sparkles className="h-3 w-3" />}
                    {item.modality === 'study_artifact' && <BookOpen className="h-3 w-3" />}
                    <span>{item.match_type.replace(/_/g, ' ')}</span>
                  </span>

                  <span className="text-xs text-slate-400">In: {item.lesson_title}</span>
                  {item.timestamp && (
                    <span className="text-xs font-mono text-violet-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  "{item.snippet}"
                </p>
              </div>

              <Link
                to={`/lessons/${item.lesson_id}`}
                className="px-3.5 py-2 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 self-start sm:self-center"
              >
                <span>Open in Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
