import React from 'react';
import {
  Calendar,
  Clock,
  Tv,
  ListOrdered,
  Bookmark,
  RefreshCw,
  Search,
  Download,
  Sparkles,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import {
  FilterState,
  SimulcastOffsetMode,
  TitleLanguage,
  ViewMode,
} from '../types/anime';
import { getLocalTimezoneName } from '../utils/dateUtils';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  titleLang: TitleLanguage;
  setTitleLang: (lang: TitleLanguage) => void;
  offsetMode: SimulcastOffsetMode;
  setOffsetMode: (mode: SimulcastOffsetMode) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allGenres: string[];
  watchlistCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  now: Date;
  onExportWatchlist: () => void;
  totalShowsCount: number;
  totalEpisodesToMar27Count: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  titleLang,
  setTitleLang,
  offsetMode,
  setOffsetMode,
  filters,
  setFilters,
  allGenres,
  watchlistCount,
  onRefresh,
  isLoading,
  now,
  onExportWatchlist,
  totalShowsCount,
  totalEpisodesToMar27Count,
}) => {
  const tzName = getLocalTimezoneName();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#2A2E3B]">
      {/* Top Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand + Live Window Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F47521] to-[#FF944D] flex items-center justify-center shadow-lg shadow-[#F47521]/25">
            <Tv className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">
                CRUNCHY<span className="text-[#F47521]">CAST</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F47521]/15 text-[#F47521] border border-[#F47521]/30">
                Today → Mar 27, 2027+
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#F47521]" />
              <span>
                {now.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                •{' '}
                <strong className="text-zinc-200 font-semibold">
                  {now.toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </strong>{' '}
                <span className="text-zinc-500">({tzName})</span>
              </span>
              <span className="hidden md:inline text-zinc-600">•</span>
              <span className="hidden md:inline text-zinc-400">
                <strong className="text-white">{totalShowsCount}</strong> active/upcoming shows •{' '}
                <strong className="text-[#F47521]">{totalEpisodesToMar27Count}</strong> episode drops through Mar 27
              </span>
            </div>
          </div>
        </div>

        {/* Primary View Tabs */}
        <div className="flex items-center bg-[#141519] p-1 rounded-xl border border-[#2A2E3B]">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Schedule</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Timeline (Today → Mar 27)</span>
          </button>

          <button
            onClick={() => setViewMode('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'catalog'
                ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>What&apos;s On ({totalShowsCount})</span>
          </button>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulcast Offset Toggle */}
          <button
            onClick={() =>
              setOffsetMode(offsetMode === 'cr_plus_1h' ? 'jp_broadcast' : 'cr_plus_1h')
            }
            title="Crunchyroll simulcasts typically drop ~1 hour after the Japanese TV broadcast. Click to switch between Estimated CR Drop (+1h) and Raw JP Broadcast time."
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              offsetMode === 'cr_plus_1h'
                ? 'bg-[#F47521]/15 border-[#F47521]/40 text-[#F47521]'
                : 'bg-[#141519] border-[#2A2E3B] text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{offsetMode === 'cr_plus_1h' ? 'CR Drop (+1h Est.)' : 'JP Broadcast Time'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setTitleLang(titleLang === 'english' ? 'romaji' : 'english')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#141519] border border-[#2A2E3B] text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
            title="Switch between English and Romaji anime titles"
          >
            <Globe className="w-3.5 h-3.5 text-[#F47521]" />
            <span>{titleLang === 'english' ? 'EN Titles' : 'Romaji'}</span>
          </button>

          {/* Export Watchlist ICS */}
          {watchlistCount > 0 && (
            <button
              onClick={onExportWatchlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2ABDBB]/15 border border-[#2ABDBB]/40 text-[#2ABDBB] hover:bg-[#2ABDBB]/25 transition-all"
              title="Export all upcoming episodes from your Watchlist through March 27 as an .ics calendar file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .ICS</span>
            </button>
          )}

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#141519] border border-[#2A2E3B] text-zinc-300 hover:text-white hover:border-[#F47521] disabled:opacity-50 transition-all"
            title="Refresh live schedule data from AniList"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F47521]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Sub-Bar */}
      <div className="bg-[#141519]/90 border-t border-[#2A2E3B]/70">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search + Genre + Season */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-xs min-w-[180px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search anime title or studio..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#F47521]"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Genre Select */}
            <select
              value={filters.selectedGenre}
              onChange={(e) => setFilters((prev) => ({ ...prev, selectedGenre: e.target.value }))}
              className="px-3 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
            >
              <option value="all">All Genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Season Filter */}
            <select
              value={filters.seasonFilter}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  seasonFilter: e.target.value as FilterState['seasonFilter'],
                }))
              }
              className="px-3 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
            >
              <option value="all">All Seasons (Now → Mar 27+)</option>
              <option value="FALL_2026">Fall 2026 Simulcasts (Oct–Dec)</option>
              <option value="WINTER_2027">Winter 2027 Simulcasts (Jan–Mar 27)</option>
            </select>

            {/* Confirmed vs Projected Episode Filter */}
            <select
              value={filters.statusFilter}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  statusFilter: e.target.value as FilterState['statusFilter'],
                }))
              }
              className="px-3 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
            >
              <option value="all">Confirmed + Projected Slots</option>
              <option value="confirmed">Confirmed Airing Slots Only</option>
              <option value="projected">Projected Future Slots Only</option>
            </select>
          </div>

          {/* Right: License Scope + Watchlist Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  includeUnassignedUpcoming: !prev.includeUnassignedUpcoming,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filters.includeUnassignedUpcoming
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                  : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle whether to include upcoming seasonal anime (e.g. Winter 2027) whose Crunchyroll link hasn't been posted on AniList yet"
            >
              {filters.includeUnassignedUpcoming ? (
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {filters.includeUnassignedUpcoming
                  ? 'Showing Confirmed CR + Likely Upcoming'
                  : 'Confirmed Crunchyroll Only'}
              </span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  watchlistOnly: !prev.watchlistOnly,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filters.watchlistOnly
                  ? 'bg-[#FAB818] text-black border-[#FAB818]'
                  : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-300 hover:border-[#FAB818]/50'
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  filters.watchlistOnly ? 'fill-black text-black' : 'text-[#FAB818]'
                }`}
              />
              <span>My Watchlist ({watchlistCount})</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
