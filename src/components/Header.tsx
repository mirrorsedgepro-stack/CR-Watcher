import React, { useState } from 'react';
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
  Bell,
  BellRing,
  Share2,
  PlayCircle,
  EyeOff,
  Trophy,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  DisplayTimezone,
  FilterState,
  SimulcastOffsetMode,
  TitleLanguage,
  ViewMode,
} from '../types/anime';
import { getTimezoneDisplayLabel } from '../utils/dateUtils';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  titleLang: TitleLanguage;
  setTitleLang: (lang: TitleLanguage) => void;
  offsetMode: SimulcastOffsetMode;
  setOffsetMode: (mode: SimulcastOffsetMode) => void;
  displayTimezone: DisplayTimezone;
  setDisplayTimezone: (tz: DisplayTimezone) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allGenres: string[];
  watchlistCount: number;
  backlogCount: number;
  onOpenBacklog: () => void;
  onOpenSyncModal: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  now: Date;
  onExportWatchlist: () => void;
  totalShowsCount: number;
  totalEpisodesToMar27Count: number;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  titleLang,
  setTitleLang,
  offsetMode,
  setOffsetMode,
  displayTimezone,
  setDisplayTimezone,
  filters,
  setFilters,
  allGenres,
  watchlistCount,
  backlogCount,
  onOpenBacklog,
  onOpenSyncModal,
  notificationsEnabled,
  onToggleNotifications,
  onRefresh,
  isLoading,
  now,
  onExportWatchlist,
  totalShowsCount,
  totalEpisodesToMar27Count,
  searchInputRef,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const tzName = getTimezoneDisplayLabel(displayTimezone);
  const tzOpt = displayTimezone !== 'local' ? { timeZone: displayTimezone } : {};

  const activeFilterCount = [
    filters.selectedGenre !== 'all',
    filters.seasonFilter !== 'all',
    filters.statusFilter !== 'all',
    filters.hideWatched,
    filters.includeUnassignedUpcoming,
    offsetMode !== 'cr_plus_1h',
    displayTimezone !== 'local',
  ].filter(Boolean).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#2A2E3B] pt-safe">
        {/* Top Bar */}
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand + Live Window Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#F47521] to-[#FF944D] flex items-center justify-center shadow-lg shadow-[#F47521]/25 shrink-0">
              <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white truncate">
                  CRUNCHY<span className="text-[#F47521]">CAST</span>
                </span>
                <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F47521]/15 text-[#F47521] border border-[#F47521]/30 whitespace-nowrap">
                  Today → Mar 27+
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 truncate">
                <Clock className="w-3 h-3 text-[#F47521] shrink-0" />
                <span className="truncate">
                  {now.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    ...tzOpt,
                  })}{' '}
                  •{' '}
                  <strong className="text-zinc-200 font-semibold">
                    {now.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      ...tzOpt,
                    })}
                  </strong>
                </span>
                <span className="hidden lg:inline text-zinc-500">({tzName})</span>
                <span className="hidden xl:inline text-zinc-600">•</span>
                <span className="hidden xl:inline text-zinc-400">
                  <strong className="text-white">{totalShowsCount}</strong> shows •{' '}
                  <strong className="text-[#F47521]">{totalEpisodesToMar27Count}</strong> drops to
                  Mar 27
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Tabs (Desktop / Tablet >= md) */}
          <div className="hidden md:flex items-center bg-[#141519] p-1 rounded-xl border border-[#2A2E3B]">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'weekly'
                  ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Grid</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'timeline'
                  ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline (Today → Mar 27)</span>
            </button>

            <button
              onClick={() => setViewMode('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'catalog'
                  ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>What&apos;s On ({totalShowsCount})</span>
            </button>

            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-[#F47521] text-black shadow-md shadow-[#F47521]/20'
                  : 'text-zinc-300 hover:text-white hover:bg-[#1B1D24]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Heatmap &amp; Finales</span>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop Backlog Button */}
            <button
              onClick={onOpenBacklog}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                backlogCount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-[#141519] border-[#2A2E3B] text-zinc-300 hover:text-white'
              }`}
              title="Open Unwatched Watchlist Backlog (Shortcut: B)"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backlog ({backlogCount})</span>
            </button>

            {/* Desktop Sub/Dub & Timezone Selects */}
            <select
              value={offsetMode}
              onChange={(e) => setOffsetMode(e.target.value as SimulcastOffsetMode)}
              className="hidden lg:block px-2.5 py-1.5 rounded-lg bg-[#141519] border border-[#2A2E3B] text-xs font-semibold text-[#F47521] focus:outline-none focus:border-[#F47521]"
              title="Select between Subbed Simulcast (+1h CR drop), Raw JP Broadcast, or Estimated English Dub (+2w)"
            >
              <option value="cr_plus_1h">Sub: CR Drop (+1h Est.)</option>
              <option value="jp_broadcast">Sub: JP TV Broadcast</option>
              <option value="dub_est_2w">Dub: Est. Simuldub (+2w)</option>
            </select>

            <select
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value as DisplayTimezone)}
              className="hidden xl:block px-2.5 py-1.5 rounded-lg bg-[#141519] border border-[#2A2E3B] text-xs font-medium text-zinc-300 focus:outline-none focus:border-[#F47521]"
              title="Switch display timezone"
            >
              <option value="local">Local Timezone</option>
              <option value="Asia/Tokyo">JST (Tokyo)</option>
              <option value="America/Los_Angeles">PT (US Pacific)</option>
              <option value="America/New_York">ET (US Eastern)</option>
              <option value="Europe/London">UK (London)</option>
              <option value="UTC">UTC</option>
            </select>

            {/* Language Toggle (Desktop) */}
            <button
              onClick={() => setTitleLang(titleLang === 'english' ? 'romaji' : 'english')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#141519] border border-[#2A2E3B] text-zinc-300 hover:text-white transition-all"
              title="Switch between English and Romaji anime titles"
            >
              <Globe className="w-3.5 h-3.5 text-[#F47521]" />
              <span>{titleLang === 'english' ? 'EN' : 'Romaji'}</span>
            </button>

            {/* Browser Notification Toggle */}
            <button
              onClick={onToggleNotifications}
              className={`p-2 sm:p-1.5 rounded-lg border transition-all ${
                notificationsEnabled
                  ? 'bg-[#F47521]/20 border-[#F47521]/50 text-[#F47521]'
                  : 'bg-[#141519] border-[#2A2E3B] text-zinc-400 hover:text-white'
              }`}
              title={
                notificationsEnabled
                  ? 'Desktop Notifications Enabled'
                  : 'Enable Notifications for Watchlist Drops'
              }
            >
              {notificationsEnabled ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* Sync / Share / Webcal Button */}
            <button
              onClick={onOpenSyncModal}
              className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#2ABDBB]/15 border border-[#2ABDBB]/40 text-[#2ABDBB] hover:bg-[#2ABDBB]/25 transition-all"
              title="Share Watchlist Link, Subscribe to Live Webcal, or Import AniList Profile"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync / Webcal</span>
            </button>

            {/* Export Watchlist ICS (Desktop) */}
            {watchlistCount > 0 && (
              <button
                onClick={onExportWatchlist}
                className="hidden sm:block p-1.5 rounded-lg bg-[#141519] border border-[#2A2E3B] text-zinc-300 hover:text-[#2ABDBB] hover:border-[#2ABDBB]/40 transition-all"
                title="Download static .ics file of Watchlist episodes"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Refresh Data */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 sm:p-1.5 rounded-lg bg-[#141519] border border-[#2A2E3B] text-zinc-300 hover:text-white hover:border-[#F47521] disabled:opacity-50 transition-all"
              title="Refresh live schedule data from AniList"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F47521]' : ''}`} />
            </button>

            {/* Mobile Filters & Settings Drawer Toggle (< md) */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className={`md:hidden relative flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                mobileFiltersOpen || activeFilterCount > 0
                  ? 'bg-[#F47521]/20 border-[#F47521] text-[#F47521]'
                  : 'bg-[#141519] border-[#2A2E3B] text-zinc-300'
              }`}
              aria-label="Toggle Filters and Settings"
            >
              {mobileFiltersOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <SlidersHorizontal className="w-4 h-4" />
              )}
              {activeFilterCount > 0 && !mobileFiltersOpen && (
                <span className="w-4 h-4 rounded-full bg-[#F47521] text-black text-[10px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Compact Search + Quick Watchlist Row (< md) */}
        <div className="md:hidden px-3 pb-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search anime or studio..."
              className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-[#141519] border border-[#2A2E3B] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F47521]"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                watchlistOnly: !prev.watchlistOnly,
              }))
            }
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all ${
              filters.watchlistOnly
                ? 'bg-[#FAB818] text-black border-[#FAB818]'
                : 'bg-[#141519] border-[#2A2E3B] text-zinc-300'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                filters.watchlistOnly ? 'fill-black text-black' : 'text-[#FAB818]'
              }`}
            />
            <span>({watchlistCount})</span>
          </button>
        </div>

        {/* Mobile Collapsible Filters & Settings Panel (< md) */}
        {mobileFiltersOpen && (
          <div className="md:hidden bg-[#141519] border-t border-[#2A2E3B] px-3 py-3.5 space-y-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Track / Offset
                </label>
                <select
                  value={offsetMode}
                  onChange={(e) => setOffsetMode(e.target.value as SimulcastOffsetMode)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs font-semibold text-[#F47521]"
                >
                  <option value="cr_plus_1h">Sub: CR Drop (+1h)</option>
                  <option value="jp_broadcast">Sub: JP Broadcast</option>
                  <option value="dub_est_2w">Dub: Est. (+2w)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Timezone
                </label>
                <select
                  value={displayTimezone}
                  onChange={(e) => setDisplayTimezone(e.target.value as DisplayTimezone)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200"
                >
                  <option value="local">Local Timezone</option>
                  <option value="Asia/Tokyo">JST (Tokyo)</option>
                  <option value="America/Los_Angeles">PT (Pacific)</option>
                  <option value="America/New_York">ET (Eastern)</option>
                  <option value="Europe/London">UK (London)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Genre
                </label>
                <select
                  value={filters.selectedGenre}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, selectedGenre: e.target.value }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200"
                >
                  <option value="all">All Genres</option>
                  {allGenres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Season
                </label>
                <select
                  value={filters.seasonFilter}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      seasonFilter: e.target.value as FilterState['seasonFilter'],
                    }))
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200"
                >
                  <option value="all">All Seasons</option>
                  <option value="FALL_2026">Fall 2026 (Oct–Dec)</option>
                  <option value="WINTER_2027">Winter 2027 (Jan–Mar)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setTitleLang(titleLang === 'english' ? 'romaji' : 'english')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0B0C10] border border-[#2A2E3B] text-zinc-200"
              >
                <Globe className="w-3.5 h-3.5 text-[#F47521]" />
                <span>{titleLang === 'english' ? 'English Titles' : 'Romaji Titles'}</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hideWatched: !prev.hideWatched,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  filters.hideWatched
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-300'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{filters.hideWatched ? 'Hiding Watched' : 'Show Watched'}</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    includeUnassignedUpcoming: !prev.includeUnassignedUpcoming,
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  filters.includeUnassignedUpcoming
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {filters.includeUnassignedUpcoming
                    ? 'CR + Likely Upcoming'
                    : 'Confirmed CR Only'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Filter & Search Sub-Bar (>= md) */}
        <div className="hidden md:block bg-[#141519]/90 border-t border-[#2A2E3B]/70">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Search + Genre + Season */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="Search anime or studio... (Press /)"
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F47521]"
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

              <select
                value={filters.selectedGenre}
                onChange={(e) => setFilters((prev) => ({ ...prev, selectedGenre: e.target.value }))}
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
              >
                <option value="all">All Genres</option>
                {allGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                value={filters.seasonFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    seasonFilter: e.target.value as FilterState['seasonFilter'],
                  }))
                }
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
              >
                <option value="all">All Seasons (Now → Mar 27+)</option>
                <option value="FALL_2026">Fall 2026 Simulcasts (Oct–Dec)</option>
                <option value="WINTER_2027">Winter 2027 Simulcasts (Jan–Mar 27)</option>
              </select>

              <select
                value={filters.statusFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    statusFilter: e.target.value as FilterState['statusFilter'],
                  }))
                }
                className="px-2.5 py-1.5 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#F47521]"
              >
                <option value="all">Confirmed + Projected</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="projected">Projected Only</option>
              </select>
            </div>

            {/* Right: Hide Watched + License Scope + Watchlist Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hideWatched: !prev.hideWatched,
                  }))
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.hideWatched
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>{filters.hideWatched ? 'Hiding Watched' : 'Show Watched'}</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    includeUnassignedUpcoming: !prev.includeUnassignedUpcoming,
                  }))
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.includeUnassignedUpcoming
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filters.includeUnassignedUpcoming ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {filters.includeUnassignedUpcoming
                    ? 'Confirmed CR + Likely Upcoming'
                    : 'Confirmed CR Only'}
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
                <span>Watchlist ({watchlistCount})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0C10]/95 backdrop-blur-lg border-t border-[#2A2E3B] pb-safe">
        <div className="grid grid-cols-5 h-14">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
              viewMode === 'weekly' ? 'text-[#F47521]' : 'text-zinc-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
              viewMode === 'timeline' ? 'text-[#F47521]' : 'text-zinc-400'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setViewMode('catalog')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
              viewMode === 'catalog' ? 'text-[#F47521]' : 'text-zinc-400'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>What&apos;s On</span>
          </button>

          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors ${
              viewMode === 'heatmap' ? 'text-[#F47521]' : 'text-zinc-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={onOpenBacklog}
            className="relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-zinc-300"
          >
            <PlayCircle className="w-4 h-4 text-emerald-400" />
            <span>Backlog</span>
            {backlogCount > 0 && (
              <span className="absolute top-1.5 right-3.5 px-1 min-w-[16px] h-4 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold flex items-center justify-center">
                {backlogCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
