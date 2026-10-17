import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Keyboard,
} from 'lucide-react';
import {
  AnimeShow,
  DisplayTimezone,
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
import { BingeHeatmapView } from './components/BingeHeatmapView';
import { ShowDetailModal } from './components/ShowDetailModal';
import { BacklogDrawer } from './components/BacklogDrawer';
import { SyncShareModal } from './components/SyncShareModal';
import {
  addDays,
  formatCountdown,
  formatTimeShort,
  startOfDay,
  TARGET_END_DATE,
} from './utils/dateUtils';
import { exportEpisodesToIcs, getDisplayTitle } from './utils/calendarExport';
import {
  checkAndFireWatchlistNotifications,
  isNotificationSupported,
  requestNotificationPermission,
} from './utils/notifications';

const WATCHLIST_STORAGE_KEY = 'crunchycast_watchlist_v1';
const WATCHED_STORAGE_KEY = 'crunchycast_watched_v1';
const CUSTOM_OFFSETS_KEY = 'crunchycast_custom_offsets_v1';
const OFFSET_MODE_KEY = 'crunchycast_offset_mode_v1';
const TITLE_LANG_KEY = 'crunchycast_title_lang_v1';
const TIMEZONE_KEY = 'crunchycast_timezone_v1';
const NOTIF_ENABLED_KEY = 'crunchycast_notif_enabled_v1';

export function App() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [titleLang, setTitleLang] = useState<TitleLanguage>(() => {
    const saved = localStorage.getItem(TITLE_LANG_KEY);
    return saved === 'romaji' ? 'romaji' : 'english';
  });

  const [offsetMode, setOffsetMode] = useState<SimulcastOffsetMode>(() => {
    const saved = localStorage.getItem(OFFSET_MODE_KEY);
    if (saved === 'jp_broadcast' || saved === 'dub_est_2w') return saved;
    return 'cr_plus_1h';
  });

  const [displayTimezone, setDisplayTimezone] = useState<DisplayTimezone>(() => {
    const saved = localStorage.getItem(TIMEZONE_KEY) as DisplayTimezone | null;
    return saved || 'local';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return (
      localStorage.getItem(NOTIF_ENABLED_KEY) === 'true' &&
      isNotificationSupported() &&
      Notification.permission === 'granted'
    );
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

  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<number, number[]>>(() => {
    try {
      const saved = localStorage.getItem(WATCHED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    selectedGenre: 'all',
    selectedDay: 'all',
    includeUnassignedUpcoming: false,
    watchlistOnly: false,
    hideWatched: false,
    statusFilter: 'all',
    seasonFilter: 'all',
  });

  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [isBacklogOpen, setIsBacklogOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Check URL query parameter ?wl=195516,189323 on mount for shared Watchlists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wlParam = params.get('wl');
    if (wlParam) {
      const ids = wlParam
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      if (ids.length > 0) {
        setWatchlist((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.add(id);
          return next;
        });
      }
    }
  }, []);

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
    localStorage.setItem(TIMEZONE_KEY, displayTimezone);
  }, [displayTimezone]);

  useEffect(() => {
    localStorage.setItem(NOTIF_ENABLED_KEY, String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_OFFSETS_KEY, JSON.stringify(customOffsets));
  }, [customOffsets]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(Array.from(watchlist)));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(watchedEpisodes));
  }, [watchedEpisodes]);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowLeft' && viewMode === 'weekly') {
        setAnchorDate((prev) => addDays(prev, -7));
      } else if (e.key === 'ArrowRight' && viewMode === 'weekly') {
        setAnchorDate((prev) => addDays(prev, 7));
      } else if (e.key.toLowerCase() === 't') {
        setAnchorDate(startOfDay(new Date()));
      } else if (e.key.toLowerCase() === 'w') {
        setFilters((prev) => ({ ...prev, watchlistOnly: !prev.watchlistOnly }));
      } else if (e.key.toLowerCase() === 'b') {
        setIsBacklogOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const allShows = useMemo(() => {
    return buildAnimeShowCatalog(rawNodes, offsetMode, customOffsets, displayTimezone);
  }, [rawNodes, offsetMode, customOffsets, displayTimezone]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const s of allShows) {
      for (const g of s.genres) {
        set.add(g);
      }
    }
    return Array.from(set).sort();
  }, [allShows]);

  const isEpisodeWatched = (showId: number, episodeNumber: number): boolean => {
    const arr = watchedEpisodes[showId];
    return Array.isArray(arr) && arr.includes(episodeNumber);
  };

  const toggleEpisodeWatched = (showId: number, episodeNumber: number) => {
    setWatchedEpisodes((prev) => {
      const current = new Set(prev[showId] || []);
      if (current.has(episodeNumber)) {
        current.delete(episodeNumber);
      } else {
        current.add(episodeNumber);
      }
      return {
        ...prev,
        [showId]: Array.from(current).sort((a, b) => a - b),
      };
    });
  };

  const markUpToEpisodeWatched = (showId: number, upToEpisode: number) => {
    setWatchedEpisodes((prev) => {
      const current = new Set(prev[showId] || []);
      for (let ep = 1; ep <= upToEpisode; ep++) {
        current.add(ep);
      }
      return {
        ...prev,
        [showId]: Array.from(current).sort((a, b) => a - b),
      };
    });
  };

  // Unwatched Backlog: Aired episodes for shows in Watchlist that aren't marked watched yet
  const backlogItems = useMemo(() => {
    const items: EnrichedEpisodeItem[] = [];
    for (const show of allShows) {
      if (!watchlist.has(show.id)) continue;
      const watchedSet = new Set(watchedEpisodes[show.id] || []);
      for (const slot of show.scheduleSlots) {
        if (slot.airingDate.getTime() <= now.getTime() && !watchedSet.has(slot.episodeNumber)) {
          items.push({ slot, show });
        }
      }
    }
    return items.sort((a, b) => b.slot.airingDate.getTime() - a.slot.airingDate.getTime());
  }, [allShows, watchlist, watchedEpisodes, now]);

  const markAllBacklogWatched = () => {
    setWatchedEpisodes((prev) => {
      const next = { ...prev };
      for (const { show, slot } of backlogItems) {
        const set = new Set(next[show.id] || []);
        set.add(slot.episodeNumber);
        next[show.id] = Array.from(set).sort((a, b) => a - b);
      }
      return next;
    });
  };

  // Check and fire desktop notifications for Watchlist episodes when enabled
  useEffect(() => {
    if (!notificationsEnabled) return;
    const watchlistEps = allShows
      .filter((s) => watchlist.has(s.id))
      .flatMap((show) => show.scheduleSlots.map((slot) => ({ slot, show })));
    checkAndFireWatchlistNotifications(watchlistEps, now, titleLang);
  }, [notificationsEnabled, allShows, watchlist, now, titleLang]);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

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
      const watchedSet = new Set(watchedEpisodes[show.id] || []);
      for (const slot of show.scheduleSlots) {
        if (filters.statusFilter === 'confirmed' && !slot.isConfirmed) continue;
        if (filters.statusFilter === 'projected' && slot.isConfirmed) continue;
        if (filters.hideWatched && watchedSet.has(slot.episodeNumber)) continue;
        list.push({ slot, show });
      }
    }
    return list;
  }, [filteredShows, filters.statusFilter, filters.hideWatched, watchedEpisodes]);

  const totalEpisodesToMar27Count = useMemo(() => {
    const todayStart = startOfDay(now);
    return filteredEpisodes.filter(
      ({ slot }) => slot.airingDate >= todayStart && slot.airingDate <= TARGET_END_DATE
    ).length;
  }, [filteredEpisodes, now]);

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

  const handleImportWatchlistIds = (ids: number[], merge: boolean) => {
    setWatchlist((prev) => {
      const next = merge ? new Set(prev) : new Set<number>();
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const handleRestoreBackup = (data: {
    watchlist?: number[];
    watchedEpisodes?: Record<number, number[]>;
    customOffsets?: Record<number, number>;
  }) => {
    if (Array.isArray(data.watchlist)) {
      setWatchlist(new Set(data.watchlist));
    }
    if (data.watchedEpisodes && typeof data.watchedEpisodes === 'object') {
      setWatchedEpisodes(data.watchedEpisodes);
    }
    if (data.customOffsets && typeof data.customOffsets === 'object') {
      setCustomOffsets(data.customOffsets);
    }
  };

  const selectedShow: AnimeShow | null = useMemo(() => {
    if (selectedShowId == null) return null;
    return allShows.find((s) => s.id === selectedShowId) || null;
  }, [allShows, selectedShowId]);

  const selectedShowWatchedSet = useMemo(() => {
    if (!selectedShow) return new Set<number>();
    return new Set(watchedEpisodes[selectedShow.id] || []);
  }, [selectedShow, watchedEpisodes]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C10] text-zinc-100">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        titleLang={titleLang}
        setTitleLang={setTitleLang}
        offsetMode={offsetMode}
        setOffsetMode={setOffsetMode}
        displayTimezone={displayTimezone}
        setDisplayTimezone={setDisplayTimezone}
        filters={filters}
        setFilters={setFilters}
        allGenres={allGenres}
        watchlistCount={watchlist.size}
        backlogCount={backlogItems.length}
        onOpenBacklog={() => setIsBacklogOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        onRefresh={() => loadScheduleData(true)}
        isLoading={isLoading}
        now={now}
        onExportWatchlist={handleExportWatchlist}
        totalShowsCount={filteredShows.length}
        totalEpisodesToMar27Count={totalEpisodesToMar27Count}
        searchInputRef={searchInputRef}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-4 sm:space-y-5">
        {/* Dropping Soon / Up Next Strip */}
        {!isLoading && droppingSoon.length > 0 && (
          <div className="bg-gradient-to-r from-[#141519] via-[#1B1D24] to-[#141519] border border-[#F47521]/30 rounded-2xl p-3 sm:p-3.5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#F47521]">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#F47521] shrink-0" />
                <span>Dropping Soon (Next 48 Hours)</span>
              </div>
              <span className="hidden sm:inline text-[11px] text-zinc-400">
                Tap any show to inspect its full weekly release calendar, trailer &amp; progress
              </span>
            </div>

            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-0.5">
              {droppingSoon.map(({ slot, show }) => {
                const title = getDisplayTitle(show, titleLang);
                const countdown = formatCountdown(slot.airingDate, now);

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedShowId(show.id)}
                    className="snap-start min-w-[235px] sm:min-w-0 bg-[#0B0C10]/90 hover:bg-[#0B0C10] border border-[#2A2E3B] hover:border-[#F47521] rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all shrink-0"
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
                          {formatTimeShort(slot.airingDate, displayTimezone)}
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
              Fetching live airing timestamps, trailers, and seasonal lineups from AniList GraphQL
              API and projecting weekly episode slots.
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
                displayTimezone={displayTimezone}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                isEpisodeWatched={isEpisodeWatched}
                onToggleEpisodeWatched={toggleEpisodeWatched}
                onSelectShow={(s) => setSelectedShowId(s.id)}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineView
                episodes={filteredEpisodes}
                now={now}
                titleLang={titleLang}
                displayTimezone={displayTimezone}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                isEpisodeWatched={isEpisodeWatched}
                onToggleEpisodeWatched={toggleEpisodeWatched}
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

            {viewMode === 'heatmap' && (
              <BingeHeatmapView
                shows={filteredShows}
                episodes={filteredEpisodes}
                now={now}
                titleLang={titleLang}
                displayTimezone={displayTimezone}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                onSelectShow={(s) => setSelectedShowId(s.id)}
                onJumpToDateInWeekly={(date) => {
                  setAnchorDate(startOfDay(date));
                  setViewMode('weekly');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2E3B] bg-[#0B0C10] pt-4 pb-20 md:pb-4 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-zinc-300">CrunchyCast Simulcast Tracker</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-400">
              <Keyboard className="w-3.5 h-3.5 text-[#F47521]" />
              <span>Shortcuts:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#141519] border border-[#2A2E3B] text-zinc-300">
                ← / →
              </kbd>
              <span>Week</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#141519] border border-[#2A2E3B] text-zinc-300">
                T
              </kbd>
              <span>Today</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#141519] border border-[#2A2E3B] text-zinc-300">
                W
              </kbd>
              <span>Watchlist</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#141519] border border-[#2A2E3B] text-zinc-300">
                B
              </kbd>
              <span>Backlog</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#141519] border border-[#2A2E3B] text-zinc-300">
                /
              </kbd>
              <span>Search</span>
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
        displayTimezone={displayTimezone}
        watchlist={watchlist}
        toggleWatchlist={toggleWatchlist}
        watchedEpisodeNums={selectedShowWatchedSet}
        onToggleEpisodeWatched={toggleEpisodeWatched}
        onMarkUpToEpisodeWatched={markUpToEpisodeWatched}
        customOffsetHours={selectedShow ? customOffsets[selectedShow.id] ?? 0 : 0}
        setCustomShowOffset={handleSetCustomShowOffset}
      />

      {/* Unwatched Backlog Drawer */}
      <BacklogDrawer
        isOpen={isBacklogOpen}
        onClose={() => setIsBacklogOpen(false)}
        backlogItems={backlogItems}
        now={now}
        titleLang={titleLang}
        displayTimezone={displayTimezone}
        onToggleWatched={toggleEpisodeWatched}
        onMarkAllBacklogWatched={markAllBacklogWatched}
        onSelectShow={(s) => {
          setIsBacklogOpen(false);
          setSelectedShowId(s.id);
        }}
      />

      {/* Multi-Device Sync, Shareable Link, AniList Import & Webcal Modal */}
      <SyncShareModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        watchlist={watchlist}
        watchedEpisodes={watchedEpisodes}
        customOffsets={customOffsets}
        onImportWatchlistIds={handleImportWatchlistIds}
        onRestoreBackup={handleRestoreBackup}
      />
    </div>
  );
}
export default App;
