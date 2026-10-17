import React, { useMemo, useState } from 'react';
import {
  Flame,
  Calendar,
  Bookmark,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import {
  AnimeShow,
  DisplayTimezone,
  EnrichedEpisodeItem,
  TitleLanguage,
} from '../types/anime';
import {
  formatCountdown,
  formatDateWithYear,
  formatTimeShort,
  startOfDay,
  TARGET_END_DATE,
} from '../utils/dateUtils';
import { getDisplayTitle } from '../utils/calendarExport';

interface BingeHeatmapViewProps {
  shows: AnimeShow[];
  episodes: EnrichedEpisodeItem[];
  now: Date;
  titleLang: TitleLanguage;
  displayTimezone: DisplayTimezone;
  watchlist: Set<number>;
  toggleWatchlist: (showId: number) => void;
  onSelectShow: (show: AnimeShow) => void;
  onJumpToDateInWeekly: (date: Date) => void;
}

const MONTHS_TO_MAR27 = [
  { key: '2026-10', label: 'Oct 2026', year: 2026, month: 9 },
  { key: '2026-11', label: 'Nov 2026', year: 2026, month: 10 },
  { key: '2026-12', label: 'Dec 2026', year: 2026, month: 11 },
  { key: '2027-01', label: 'Jan 2027', year: 2027, month: 0 },
  { key: '2027-02', label: 'Feb 2027', year: 2027, month: 1 },
  { key: '2027-03', label: 'Mar 2027 (→ Mar 27)', year: 2027, month: 2 },
];

export const BingeHeatmapView: React.FC<BingeHeatmapViewProps> = ({
  shows,
  episodes,
  now,
  titleLang,
  displayTimezone,
  watchlist,
  toggleWatchlist,
  onSelectShow,
  onJumpToDateInWeekly,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');

  const dayStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { count: number; premieres: number; finales: number; items: EnrichedEpisodeItem[] }
    >();
    for (const item of episodes) {
      const d = item.slot.airingDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { count: 0, premieres: 0, finales: 0, items: [] });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      if (item.slot.isPremiere) entry.premieres += 1;
      if (item.slot.isFinale) entry.finales += 1;
      entry.items.push(item);
    }
    return map;
  }, [episodes]);

  const bingeFinaleShows = useMemo(() => {
    const todayStart = startOfDay(now);
    return shows
      .filter((s) => s.finaleSlot && s.finaleSlot.airingDate >= todayStart)
      .sort(
        (a, b) =>
          a.finaleSlot!.airingDate.getTime() - b.finaleSlot!.airingDate.getTime()
      );
  }, [shows, now]);

  const activeMonth =
    MONTHS_TO_MAR27.find((m) => m.key === selectedMonthKey) || MONTHS_TO_MAR27[0];

  const daysInMonthGrid = useMemo(() => {
    const firstDay = new Date(activeMonth.year, activeMonth.month, 1);
    const lastDay = new Date(activeMonth.year, activeMonth.month + 1, 0);
    const totalDays = lastDay.getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7;

    const cells: ({ day: number; date: Date; key: string } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(activeMonth.year, activeMonth.month, day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      cells.push({ day, date: d, key });
    }
    return cells;
  }, [activeMonth]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section 1: Interactive Release Density Heatmap (Today -> March 27) */}
      <section className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-3 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F47521] shrink-0" />
              <span>Simulcast Release Density Heatmap (Today → Mar 27)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tap any date cell to jump directly to that week&apos;s full simulcast schedule.
            </p>
          </div>

          {/* Month Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full sm:w-auto">
            {MONTHS_TO_MAR27.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMonthKey(m.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedMonthKey === m.key
                    ? 'bg-[#F47521] text-black border-[#F47521]'
                    : 'bg-[#0B0C10] text-zinc-400 border-[#2A2E3B] hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400 pt-1">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {daysInMonthGrid.map((cell, idx) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-14 sm:h-24 md:h-28 rounded-lg sm:rounded-xl bg-[#0B0C10]/30 border border-[#2A2E3B]/30"
                />
              );
            }

            const stats = dayStatsMap.get(cell.key);
            const count = stats?.count || 0;
            const isToday =
              cell.date.getFullYear() === now.getFullYear() &&
              cell.date.getMonth() === now.getMonth() &&
              cell.date.getDate() === now.getDate();
            const isMar27 =
              cell.date.getFullYear() === 2027 &&
              cell.date.getMonth() === 2 &&
              cell.date.getDate() === 27;

            const intensityClass =
              count === 0
                ? 'bg-[#0B0C10] border-[#2A2E3B]/60'
                : count <= 3
                ? 'bg-[#F47521]/10 border-[#F47521]/30 hover:border-[#F47521]'
                : count <= 7
                ? 'bg-[#F47521]/20 border-[#F47521]/50 hover:border-[#F47521]'
                : 'bg-[#F47521]/30 border-[#F47521] shadow-md shadow-[#F47521]/10';

            return (
              <div
                key={cell.key}
                onClick={() => onJumpToDateInWeekly(cell.date)}
                className={`h-14 sm:h-24 md:h-28 rounded-lg sm:rounded-xl p-1 sm:p-2 border flex flex-col justify-between cursor-pointer transition-all sm:hover:scale-[1.02] ${intensityClass} ${
                  isToday ? 'ring-2 ring-[#F47521]' : isMar27 ? 'ring-2 ring-[#2ABDBB]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] sm:text-sm font-extrabold ${
                      isToday
                        ? 'text-[#F47521]'
                        : isMar27
                        ? 'text-[#2ABDBB]'
                        : 'text-zinc-200'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {isToday && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#F47521] text-black uppercase">
                      Today
                    </span>
                  )}
                  {isMar27 && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#2ABDBB] text-black uppercase">
                      Mar 27
                    </span>
                  )}
                </div>

                {/* Mobile compact indicator vs Desktop detailed badges */}
                <div className="space-y-0.5 sm:space-y-1">
                  {count > 0 ? (
                    <>
                      <div className="text-[10px] sm:text-xs font-extrabold text-white truncate">
                        <span>{count}</span>
                        <span className="hidden sm:inline">
                          {count === 1 ? ' Episode' : ' Episodes'}
                        </span>
                        <span className="sm:hidden"> ep</span>
                      </div>

                      {/* Desktop Premiere/Finale Badges */}
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {stats!.premieres > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/25 text-emerald-300 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> {stats!.premieres} Prem
                          </span>
                        )}
                        {stats!.finales > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/25 text-amber-300">
                            ★ {stats!.finales} Finale
                          </span>
                        )}
                      </div>

                      {/* Mobile Compact Dots */}
                      <div className="flex sm:hidden items-center gap-1">
                        {stats!.premieres > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        {stats!.finales > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] text-zinc-600">-</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Binge-Ready Season Finale Finder */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FAB818] shrink-0" />
              <span>Binge-Ready Season Finale Finder ({bingeFinaleShows.length} Series)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Waiting for a whole season to finish so you can binge-watch it? Here is the exact
              date each series completes its run.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bingeFinaleShows.map((show) => {
            const title = getDisplayTitle(show, titleLang);
            const finale = show.finaleSlot!;
            const airedCount = show.scheduleSlots.filter(
              (s) => s.airingDate.getTime() <= now.getTime()
            ).length;
            const totalCount = show.scheduleSlots.length;
            const pct = totalCount > 0 ? Math.round((airedCount / totalCount) * 100) : 0;
            const countdown = formatCountdown(finale.airingDate, now);
            const inWatchlist = watchlist.has(show.id);
            const beforeMar27 = finale.airingDate <= TARGET_END_DATE;

            return (
              <div
                key={show.id}
                onClick={() => onSelectShow(show)}
                className="bg-[#141519] hover:bg-[#1B1D24] border border-[#2A2E3B] hover:border-[#FAB818]/60 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all shadow-lg"
              >
                <div className="flex gap-3.5">
                  <img
                    src={show.coverImage.large}
                    alt={title}
                    className="w-16 h-24 object-cover rounded-xl shrink-0 border border-[#2A2E3B]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Finale: EP {finale.episodeNumber}
                      </span>
                      {beforeMar27 && (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Completes ≤ Mar 27
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-white line-clamp-2 mt-1">
                      {title}
                    </h3>

                    <div className="mt-2 text-xs text-zinc-300">
                      Binge-Ready:{' '}
                      <strong className="text-[#FAB818]">
                        {formatDateWithYear(finale.airingDate, displayTimezone)}
                      </strong>{' '}
                      at {formatTimeShort(finale.airingDate, displayTimezone)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-[#2A2E3B]/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">
                      Season Progress:{' '}
                      <strong className="text-white">
                        {airedCount} / {totalCount} Aired ({pct}%)
                      </strong>
                    </span>
                    <span className="font-bold text-[#F47521]">{countdown.text}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0B0C10] overflow-hidden border border-[#2A2E3B]">
                    <div
                      className="h-full bg-gradient-to-r from-[#F47521] to-[#FAB818]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div
                    className="flex items-center justify-between pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onJumpToDateInWeekly(finale.airingDate)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-[#F47521] flex items-center gap-1"
                    >
                      <span>Jump to Finale Week</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => toggleWatchlist(show.id)}
                      className={`p-1 rounded ${
                        inWatchlist ? 'text-[#FAB818]' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-[#FAB818]' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
