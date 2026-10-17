import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  AnimeShow,
  EnrichedEpisodeItem,
  FilterState,
  SimulcastOffsetMode,
  TitleLanguage,
  ViewMode,
} from './types/anime';
import {
  buildAnimeShowCatalog,
  fetchRawAnimeNodes,
} from './services/anilistApi';
import { Header } from './components/Header';
import { WeeklyCalendarView } from './components/WeeklyCalendarView';
import { TimelineView } from './components/TimelineView';
import { ShowCatalogView } from './components/ShowCatalogView';
import { ShowDetailModal } from './components/ShowDetailModal';
import {
  formatCountdown,
  formatTimeShort,
  startOfDay,
  TARGET_END_DATE,
} from './utils/dateUtils';
import { exportEpisodesToIcs, getDisplayTitle } from './utils/calendarExport';

const WATCHLIST_STORAGE_KEY = 'crunchycast_watchlist_v1';
const CUSTOM_OFFSETS_KEY = 'crunchycast_custom_offsets_v1';
const OFFSET_MODE_KEY = 'crunchycast_offset_mode_v1';
const TITLE_LANG_KEY = 'crunchycast_title_lang_v1';

export function App() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const [titleLang, setTitleLang] = useState<TitleLanguage>(() => {
    const saved = localStorage.getItem(TITLE_LANG_KEY);
    return saved === 'romaji' ? 'romaji' : 'english';
  });

  const [offsetMode, setOffsetMode] = useState<SimulcastOffsetMode>(() => {
    const saved = localStorage.getItem(OFFSET_MODE_KEY);
    return saved === 'jp_broadcast' ? 'jp_broadcast' : 'cr_plus_1h';
  });

  const [customOffsets, setCustomOffsets] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_OFFSETS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [watchlist, setWatchlist] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedGenre: 'all',
    selectedDay: 'all',
    includeUnassignedUpcoming: false,
    watchlistOnly: false,
    statusFilter: 'all',
    seasonFilter: 'all',
  });

  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // Live clock tick every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(TITLE_LANG_KEY, titleLang);
  }, [titleLang]);

  useEffect(() => {
    localStorage.setItem(OFFSET_MODE_KEY, offsetMode);
  }, [offsetMode]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_OFFSETS_KEY, JSON.stringify(customOffsets));
  }, [customOffsets]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(Array.from(watchlist)));
  }, [watchlist]);

  const loadScheduleData = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchRawAnimeNodes(forceRefresh);
      setRawNodes(res.nodes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load simulcast schedule from AniList.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData(false);
  }, []);

  const allShows = useMemo(() => {
    return buildAnimeShowCatalog(rawNodes, offsetMode, customOffsets);
  }, [rawNodes, offsetMode, customOffsets]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const s of allShows) {
      for (const g of s.genres) {
        set.add(g);
      }
    }
    return Array.from(set).sort();
  }, [allShows]);

  // Apply show-level filters
  const filteredShows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return allShows.filter((show) => {
      if (!filters.includeUnassignedUpcoming && !show.isCrunchyrollConfirmed) {
        return false;
      }

      if (filters.watchlistOnly && !watchlist.has(show.id)) {
        return false;
      }

      if (filters.selectedGenre !== 'all' && !show.genres.includes(filters.selectedGenre)) {
        return false;
      }

      if (filters.seasonFilter === 'FALL_2026') {
        const isFall =
          (show.season === 'FALL' && show.seasonYear === 2026) || show.status === 'RELEASING';
        if (!isFall) return false;
      } else if (filters.seasonFilter === 'WINTER_2027') {
        const isWinter = show.season === 'WINTER' && show.seasonYear === 2027;
        if (!isWinter) return false;
      }

      if (q) {
        const en = (show.title.english || '').toLowerCase();
        const ro = (show.title.romaji || '').toLowerCase();
        const st = show.studios.join(' ').toLowerCase();
        if (!en.includes(q) && !ro.includes(q) && !st.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allShows, filters, watchlist]);

  // Flatten and filter all episode slots from filteredShows
  const filteredEpisodes = useMemo(() => {
    const list: EnrichedEpisodeItem[] = [];
    for (const show of filteredShows) {
      for (const slot of show.scheduleSlots) {
        if (filters.statusFilter === 'confirmed' && !slot.isConfirmed) continue;
        if (filters.statusFilter === 'projected' && slot.isConfirmed) continue;
        list.push({ slot, show });
      }
    }
    return list;
  }, [filteredShows, filters.statusFilter]);

  // Count episodes between Today and March 27, 2027
  const totalEpisodesToMar27Count = useMemo(() => {
    const todayStart = startOfDay(now);
    return filteredEpisodes.filter(
      ({ slot }) => slot.airingDate >= todayStart && slot.airingDate <= TARGET_END_DATE
    ).length;
  }, [filteredEpisodes, now]);

  // Next 5 episodes dropping in the next 48 hours from `now`
  const droppingSoon = useMemo(() => {
    return filteredEpisodes
      .filter(({ slot }) => {
        const diff = slot.airingDate.getTime() - now.getTime();
        return diff >= -1000 * 60 * 30 && diff <= 1000 * 60 * 60 * 48;
      })
      .sort((a, b) => a.slot.airingDate.getTime() - b.slot.airingDate.getTime())
      .slice(0, 5);
  }, [filteredEpisodes, now]);

  const toggleWatchlist = (showId: number) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(showId)) {
        next.delete(showId);
      } else {
        next.add(showId);
      }
      return next;
    });
  };

  const handleSetCustomShowOffset = (showId: number, hours: number) => {
    setCustomOffsets((prev) => ({
      ...prev,
      [showId]: hours,
    }));
  };

  const handleExportWatchlist = () => {
    const todayStart = startOfDay(now);
    const watchlistEpisodes = allShows
      .filter((s) => watchlist.has(s.id))
      .flatMap((show) =>
        show.scheduleSlots
          .filter((slot) => slot.airingDate >= todayStart && slot.airingDate <= TARGET_END_DATE)
          .map((slot) => ({ slot, show }))
      )
      .sort((a, b) => a.slot.airingDate.getTime() - b.slot.airingDate.getTime());

    exportEpisodesToIcs(watchlistEpisodes, titleLang, 'my-crunchyroll-watchlist-to-mar27.ics');
  };

  const selectedShow: AnimeShow | null = useMemo(() => {
    if (selectedShowId == null) return null;
    return allShows.find((s) => s.id === selectedShowId) || null;
  }, [allShows, selectedShowId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C10] text-zinc-100">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        titleLang={titleLang}
        setTitleLang={setTitleLang}
        offsetMode={offsetMode}
        setOffsetMode={setOffsetMode}
        filters={filters}
        setFilters={setFilters}
        allGenres={allGenres}
        watchlistCount={watchlist.size}
        onRefresh={() => loadScheduleData(true)}
        isLoading={isLoading}
        now={now}
        onExportWatchlist={handleExportWatchlist}
        totalShowsCount={filteredShows.length}
        totalEpisodesToMar27Count={totalEpisodesToMar27Count}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Dropping Soon / Up Next Strip */}
        {!isLoading && droppingSoon.length > 0 && (
          <div className="bg-gradient-to-r from-[#141519] via-[#1B1D24] to-[#141519] border border-[#F47521]/30 rounded-2xl p-3.5 shadow-lg">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#F47521]">
                <Flame className="w-4 h-4 fill-[#F47521]" />
                <span>Dropping Soon from Today (Next 48 Hours)</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Click any show to inspect its full weekly release calendar through March 27
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {droppingSoon.map(({ slot, show }) => {
                const title = getDisplayTitle(show, titleLang);
                const countdown = formatCountdown(slot.airingDate, now);

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedShowId(show.id)}
                    className="bg-[#0B0C10]/90 hover:bg-[#0B0C10] border border-[#2A2E3B] hover:border-[#F47521] rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all"
                  >
                    <img
                      src={show.coverImage.large}
                      alt={title}
                      className="w-10 h-14 object-cover rounded-lg shrink-0 border border-[#2A2E3B]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#F47521]/20 text-[#F47521]">
                          EP {slot.episodeNumber}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          {countdown.text}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-1">{title}</h4>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#F47521]" />
                        <span>
                          {slot.airingDate.toLocaleDateString(undefined, { weekday: 'short' })}{' '}
                          {formatTimeShort(slot.airingDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading / Error / Main Content */}
        {isLoading ? (
          <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-16 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[#F47521] animate-spin" />
            <div className="text-base font-bold text-white">
              Loading Crunchyroll Simulcast Schedule (Today → March 27, 2027)...
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Fetching live airing timestamps and seasonal lineups from AniList GraphQL API and
              projecting weekly episode slots.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <div className="text-base font-bold text-white">{error}</div>
            <button
              onClick={() => loadScheduleData(true)}
              className="px-4 py-2 rounded-xl bg-[#F47521] text-black font-bold text-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'weekly' && (
              <WeeklyCalendarView
                episodes={filteredEpisodes}
                anchorDate={anchorDate}
                setAnchorDate={setAnchorDate}
                now={now}
                titleLang={titleLang}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                onSelectShow={(s) => setSelectedShowId(s.id)}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineView
                episodes={filteredEpisodes}
                now={now}
                titleLang={titleLang}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                onSelectShow={(s) => setSelectedShowId(s.id)}
              />
            )}

            {viewMode === 'catalog' && (
              <ShowCatalogView
                shows={filteredShows}
                now={now}
                titleLang={titleLang}
                filters={filters}
                setFilters={setFilters}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                onSelectShow={(s) => setSelectedShowId(s.id)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2E3B] bg-[#0B0C10] py-4 px-6 text-xs text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">CrunchyCast Simulcast Tracker</span>
            <span>•</span>
            <span>
              Tracks confirmed &amp; projected weekly episode drops from Today through March 27,
              2027 and beyond.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              ● Confirmed Slot = Official broadcast timestamp
            </span>
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3 h-3" /> Projected Slot = Weekly 7-day cadence projection
            </span>
            <a
              href="https://www.crunchyroll.com/simulcastcalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F47521] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Official CR Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Show Details & Full Episode Schedule Modal */}
      <ShowDetailModal
        show={selectedShow}
        onClose={() => setSelectedShowId(null)}
        now={now}
        titleLang={titleLang}
        watchlist={watchlist}
        toggleWatchlist={toggleWatchlist}
        customOffsetHours={selectedShow ? customOffsets[selectedShow.id] ?? 0 : 0}
        setCustomShowOffset={handleSetCustomShowOffset}
      />
    </div>
  );
}
export default App;
