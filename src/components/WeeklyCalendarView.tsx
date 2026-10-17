import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Flame,
  FastForward,
  Check,
} from 'lucide-react';
import {
  AnimeShow,
  DisplayTimezone,
  EnrichedEpisodeItem,
  TitleLanguage,
} from '../types/anime';
import {
  addDays,
  formatCountdown,
  formatDateShort,
  formatDateWithYear,
  formatTimeShort,
  getWeekDays,
  isSameDay,
  startOfDay,
} from '../utils/dateUtils';
import { getDisplayTitle } from '../utils/calendarExport';

interface WeeklyCalendarViewProps {
  episodes: EnrichedEpisodeItem[];
  anchorDate: Date;
  setAnchorDate: (date: Date) => void;
  now: Date;
  titleLang: TitleLanguage;
  displayTimezone: DisplayTimezone;
  watchlist: Set<number>;
  toggleWatchlist: (showId: number) => void;
  isEpisodeWatched: (showId: number, episodeNumber: number) => boolean;
  onToggleEpisodeWatched: (showId: number, episodeNumber: number) => void;
  onSelectShow: (show: AnimeShow) => void;
}

const MILESTONE_JUMPS = [
  { label: 'Today', getTarget: (now: Date) => startOfDay(now) },
  { label: 'Nov 1, 2026', getTarget: () => new Date('2026-11-01T00:00:00') },
  { label: 'Dec 1, 2026', getTarget: () => new Date('2026-12-01T00:00:00') },
  { label: 'Jan 8, 2027 (Winter)', getTarget: () => new Date('2027-01-08T00:00:00') },
  { label: 'Feb 1, 2027', getTarget: () => new Date('2027-02-01T00:00:00') },
  { label: 'Mar 1, 2027', getTarget: () => new Date('2027-03-01T00:00:00') },
  { label: 'Mar 21–27 (Target)', getTarget: () => new Date('2027-03-21T00:00:00') },
  { label: 'Apr 2027+', getTarget: () => new Date('2027-04-03T00:00:00') },
];

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  episodes,
  anchorDate,
  setAnchorDate,
  now,
  titleLang,
  displayTimezone,
  watchlist,
  toggleWatchlist,
  isEpisodeWatched,
  onToggleEpisodeWatched,
  onSelectShow,
}) => {
  const [rolling7Days, setRolling7Days] = useState<boolean>(true);
  // On mobile (< md), allow focusing a single day tab (0..6) or 'all'
  const [mobileDayFocus, setMobileDayFocus] = useState<number | 'all'>(0);

  // Reset mobileDayFocus to 0 (first day of selected range) when anchorDate changes
  useEffect(() => {
    setMobileDayFocus(0);
  }, [anchorDate]);

  const weekDays = getWeekDays(anchorDate, rolling7Days);
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  const diffDaysFromToday = Math.round(
    (startOfDay(anchorDate).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const picked = new Date(`${e.target.value}T00:00:00`);
    if (!Number.isNaN(picked.getTime())) {
      setAnchorDate(picked);
    }
  };

  const dateInputVal = `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(anchorDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Week Navigation & Future Scrubber Panel */}
      <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Active Week Range Title (Top on mobile for immediate orientation) */}
          <div className="flex items-center justify-between sm:order-2">
            <div>
              <div className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-[#F47521]">
                {diffDaysFromToday === 0
                  ? 'Starting Today (7-Day Window)'
                  : diffDaysFromToday > 0
                  ? `Looking ${diffDaysFromToday} Days into the Future`
                  : `${Math.abs(diffDaysFromToday)} Days Ago`}
              </div>
              <h2 className="text-sm sm:text-xl font-extrabold text-white">
                {formatDateWithYear(firstDay)} — {formatDateWithYear(lastDay)}
              </h2>
            </div>
          </div>

          {/* Prev / Today / Next Controls */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 sm:order-1">
            <button
              onClick={() => setAnchorDate(addDays(anchorDate, -7))}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-xs sm:text-sm font-semibold text-zinc-200 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-[#F47521]" />
              <span>Prev 7d</span>
            </button>

            <button
              onClick={() => setAnchorDate(startOfDay(now))}
              className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border text-center transition-all ${
                isSameDay(anchorDate, now)
                  ? 'bg-[#F47521] text-black border-[#F47521]'
                  : 'bg-[#1B1D24] text-[#F47521] border-[#F47521]/40 hover:bg-[#F47521]/15'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => setAnchorDate(addDays(anchorDate, 7))}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-xs sm:text-sm font-semibold text-zinc-200 transition-all"
            >
              <span>Next 7d</span>
              <ChevronRight className="w-4 h-4 text-[#F47521]" />
            </button>
          </div>

          {/* Date Picker + Grid Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:order-3">
            <div className="flex items-center gap-1.5 bg-[#0B0C10] border border-[#2A2E3B] rounded-xl px-2.5 py-1.5 flex-1 sm:flex-initial">
              <CalendarIcon className="w-3.5 h-3.5 text-[#F47521] shrink-0" />
              <span className="text-[11px] text-zinc-400 whitespace-nowrap">Date:</span>
              <input
                type="date"
                value={dateInputVal}
                onChange={handleDateInputChange}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full"
              />
            </div>

            <button
              onClick={() => setRolling7Days(!rolling7Days)}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-[11px] sm:text-xs font-medium text-zinc-300 transition-all whitespace-nowrap"
            >
              {rolling7Days ? '7d from Start' : 'Mon–Sun'}
            </button>
          </div>
        </div>

        {/* Future Scrubber Slider + Quick Milestone Pills (Today -> March 27+) */}
        <div className="mt-3 pt-3 border-t border-[#2A2E3B]/70 flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <FastForward className="w-4 h-4 text-[#F47521] shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold text-zinc-400 shrink-0">
              Time Scrubber (Today → Mar 27+):
            </span>
            <input
              type="range"
              min={-7}
              max={190}
              value={Math.max(-7, Math.min(190, diffDaysFromToday))}
              onChange={(e) => setAnchorDate(addDays(startOfDay(now), Number(e.target.value)))}
              className="w-full accent-[#F47521] h-2 bg-[#0B0C10] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-300 shrink-0 min-w-[54px] text-right">
              {diffDaysFromToday >= 0 ? `+${diffDaysFromToday}d` : `${diffDaysFromToday}d`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {MILESTONE_JUMPS.map((m) => {
              const target = m.getTarget(now);
              const isActive = isSameDay(anchorDate, target);
              return (
                <button
                  key={m.label}
                  onClick={() => setAnchorDate(target)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[#F47521] text-black border-[#F47521]'
                      : 'bg-[#0B0C10] text-zinc-400 border-[#2A2E3B] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Day-of-Week Quick Selector Strip (< md) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setMobileDayFocus('all')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border shrink-0 transition-all ${
            mobileDayFocus === 'all'
              ? 'bg-[#F47521] text-black border-[#F47521]'
              : 'bg-[#141519] text-zinc-300 border-[#2A2E3B]'
          }`}
        >
          All 7 Days
        </button>

        {weekDays.map((d, idx) => {
          const isToday = isSameDay(d, now);
          const count = episodes.filter((ep) => isSameDay(ep.slot.airingDate, d)).length;
          const active = mobileDayFocus === idx;

          return (
            <button
              key={d.toISOString()}
              onClick={() => setMobileDayFocus(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border shrink-0 flex items-center gap-1.5 transition-all ${
                active
                  ? 'bg-[#F47521] text-black border-[#F47521] shadow-md shadow-[#F47521]/20'
                  : isToday
                  ? 'bg-[#141519] text-[#F47521] border-[#F47521]/50'
                  : 'bg-[#141519] text-zinc-300 border-[#2A2E3B]'
              }`}
            >
              <span>
                {d.toLocaleDateString(undefined, { weekday: 'short' })} {d.getDate()}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  active ? 'bg-black/20 text-black' : 'bg-[#0B0C10] text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 7-Day Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {weekDays.map((dayDate, dayIdx) => {
          const isHiddenOnMobile = mobileDayFocus !== 'all' && mobileDayFocus !== dayIdx;
          const isToday = isSameDay(dayDate, now);
          const isMar27 =
            dayDate.getFullYear() === 2027 &&
            dayDate.getMonth() === 2 &&
            dayDate.getDate() === 27;

          const dayEpisodes = episodes
            .filter((item) => isSameDay(item.slot.airingDate, dayDate))
            .sort((a, b) => a.slot.airingDate.getTime() - b.slot.airingDate.getTime());

          return (
            <div
              key={dayDate.toISOString()}
              className={`${
                isHiddenOnMobile ? 'hidden md:flex' : 'flex'
              } flex-col rounded-2xl border overflow-hidden transition-all ${
                isToday
                  ? 'bg-[#141519] border-[#F47521] shadow-lg shadow-[#F47521]/10'
                  : isMar27
                  ? 'bg-[#141519] border-[#2ABDBB] shadow-lg shadow-[#2ABDBB]/10'
                  : 'bg-[#141519]/90 border-[#2A2E3B]'
              }`}
            >
              {/* Column Header */}
              <div
                className={`px-3.5 py-3 border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-gradient-to-r from-[#F47521]/25 to-[#F47521]/5 border-[#F47521]/40'
                    : isMar27
                    ? 'bg-gradient-to-r from-[#2ABDBB]/25 to-transparent border-[#2ABDBB]/40'
                    : 'bg-[#1B1D24]/70 border-[#2A2E3B]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-extrabold uppercase tracking-wide ${
                        isToday ? 'text-[#F47521]' : 'text-white'
                      }`}
                    >
                      {dayDate.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-[#F47521] text-black">
                        Today
                      </span>
                    )}
                    {isMar27 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-[#2ABDBB] text-black">
                        Mar 27 Target
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 font-medium">
                    {formatDateShort(dayDate)}, {dayDate.getFullYear()}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#0B0C10] text-zinc-300 border border-[#2A2E3B]">
                  {dayEpisodes.length} {dayEpisodes.length === 1 ? 'ep' : 'eps'}
                </span>
              </div>

              {/* Episodes List */}
              <div className="p-2.5 space-y-2.5 flex-1">
                {dayEpisodes.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-500">
                    No matching episodes scheduled on this day.
                  </div>
                ) : (
                  dayEpisodes.map(({ slot, show }) => {
                    const title = getDisplayTitle(show, titleLang);
                    const countdown = formatCountdown(slot.airingDate, now);
                    const inWatchlist = watchlist.has(show.id);
                    const watched = isEpisodeWatched(show.id, slot.episodeNumber);

                    return (
                      <div
                        key={slot.id}
                        onClick={() => onSelectShow(show)}
                        className={`group relative rounded-xl p-2.5 border transition-all cursor-pointer ${
                          watched
                            ? 'bg-emerald-950/10 border-emerald-500/30 opacity-65 hover:opacity-100'
                            : countdown.isPast
                            ? 'bg-[#0B0C10]/70 border-[#2A2E3B]/60 opacity-85 hover:opacity-100 hover:border-zinc-600'
                            : countdown.isImminent
                            ? 'bg-[#1B1D24] border-[#F47521]/60 hover:border-[#F47521] shadow-md shadow-[#F47521]/5'
                            : 'bg-[#1B1D24] border-[#2A2E3B] hover:border-[#F47521]/60 hover:bg-[#232630]'
                        }`}
                      >
                        {/* Top Time & Countdown Bar */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#F47521]" />
                            <span className="text-xs font-extrabold text-white">
                              {formatTimeShort(slot.airingDate, displayTimezone)}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              watched
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : countdown.isPast
                                ? 'bg-zinc-800 text-zinc-400'
                                : countdown.isImminent
                                ? 'bg-[#F47521] text-black animate-pulse'
                                : 'bg-[#0B0C10] text-[#F47521] border border-[#F47521]/30'
                            }`}
                          >
                            {watched ? '✓ Watched' : countdown.text}
                          </span>
                        </div>

                        {/* Card Body: Cover + Info */}
                        <div className="flex gap-2.5">
                          <img
                            src={show.coverImage.large}
                            alt={title}
                            loading="lazy"
                            className="w-12 h-16 object-cover rounded-lg shrink-0 bg-zinc-900 border border-[#2A2E3B]"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-zinc-100 group-hover:text-[#F47521] transition-colors line-clamp-2 leading-snug">
                              {title}
                            </h3>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#F47521]/20 text-[#F47521] border border-[#F47521]/30">
                                EP {slot.episodeNumber}
                              </span>

                              {slot.isPremiere && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> PREMIERE
                                </span>
                              )}

                              {slot.isFinale && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  FINALE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Status & Quick Actions */}
                        <div className="mt-2 pt-2 border-t border-[#2A2E3B]/60 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1">
                            {slot.isConfirmed ? (
                              <span
                                className="inline-flex items-center gap-1 text-emerald-400 font-semibold"
                                title="Confirmed airing timestamp from AniList schedule"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-amber-300/90 font-semibold"
                                title="Projected weekly simulcast slot based on the show's regular release cadence"
                              >
                                <Sparkles className="w-3 h-3" />
                                Projected
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onToggleEpisodeWatched(show.id, slot.episodeNumber)}
                              className={`p-1.5 sm:p-1 rounded transition-colors ${
                                watched
                                  ? 'bg-emerald-500 text-black'
                                  : 'hover:bg-[#0B0C10] text-zinc-400 hover:text-emerald-400'
                              }`}
                              title={watched ? 'Mark Unwatched' : 'Mark Episode Watched'}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            <button
                              onClick={() => toggleWatchlist(show.id)}
                              className={`p-1.5 sm:p-1 rounded hover:bg-[#0B0C10] transition-colors ${
                                inWatchlist ? 'text-[#FAB818]' : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-[#FAB818]' : ''}`}
                              />
                            </button>

                            <a
                              href={show.crunchyrollUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 sm:p-1 rounded hover:bg-[#0B0C10] text-zinc-400 hover:text-[#F47521] transition-colors"
                              title="Open on Crunchyroll"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
