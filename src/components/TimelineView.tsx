import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Flame,
  CalendarPlus,
  Download,
  ChevronRight,
} from 'lucide-react';
import {
  AnimeShow,
  EnrichedEpisodeItem,
  TitleLanguage,
} from '../types/anime';
import {
  formatCountdown,
  formatFullDayHeader,
  formatTimeShort,
  isSameDay,
  startOfDay,
  TARGET_END_DATE,
} from '../utils/dateUtils';
import {
  exportEpisodesToIcs,
  getDisplayTitle,
  getGoogleCalendarUrl,
} from '../utils/calendarExport';

interface TimelineViewProps {
  episodes: EnrichedEpisodeItem[];
  now: Date;
  titleLang: TitleLanguage;
  watchlist: Set<number>;
  toggleWatchlist: (showId: number) => void;
  onSelectShow: (show: AnimeShow) => void;
}

type MonthScope =
  | 'today_to_mar27'
  | '2026-10'
  | '2026-11'
  | '2026-12'
  | '2027-01'
  | '2027-02'
  | '2027-03'
  | 'beyond_mar27';

export const TimelineView: React.FC<TimelineViewProps> = ({
  episodes,
  now,
  titleLang,
  watchlist,
  toggleWatchlist,
  onSelectShow,
}) => {
  const [monthScope, setMonthScope] = useState<MonthScope>('today_to_mar27');
  const [milestonesOnly, setMilestonesOnly] = useState<boolean>(false);
  const [hideAlreadyAiredToday, setHideAlreadyAiredToday] = useState<boolean>(false);
  const [visibleDaysLimit, setVisibleDaysLimit] = useState<number>(21);

  const filteredItems = useMemo(() => {
    const todayStart = startOfDay(now);

    return episodes
      .filter(({ slot }) => {
        const d = slot.airingDate;
        if (d < todayStart) return false;
        if (hideAlreadyAiredToday && d < now) return false;

        if (milestonesOnly && !slot.isPremiere && !slot.isFinale) {
          return false;
        }

        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        if (monthScope === 'today_to_mar27') {
          return d <= TARGET_END_DATE;
        }
        if (monthScope === 'beyond_mar27') {
          return d > TARGET_END_DATE;
        }
        if (monthScope === '2027-03') {
          return ym === '2027-03' && d <= TARGET_END_DATE;
        }
        return ym === monthScope;
      })
      .sort((a, b) => a.slot.airingDate.getTime() - b.slot.airingDate.getTime());
  }, [episodes, now, monthScope, milestonesOnly, hideAlreadyAiredToday]);

  // Group by calendar day string
  const groupedDays = useMemo(() => {
    const map = new Map<string, { date: Date; items: EnrichedEpisodeItem[] }>();
    for (const item of filteredItems) {
      const d = item.slot.airingDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { date: startOfDay(d), items: [] });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [filteredItems]);

  const visibleGroups = groupedDays.slice(0, visibleDaysLimit);

  const monthTabs: { id: MonthScope; label: string }[] = [
    { id: 'today_to_mar27', label: 'All (Today → Mar 27)' },
    { id: '2026-10', label: 'Oct 2026 (From Today)' },
    { id: '2026-11', label: 'Nov 2026' },
    { id: '2026-12', label: 'Dec 2026' },
    { id: '2027-01', label: 'Jan 2027 (Winter Season)' },
    { id: '2027-02', label: 'Feb 2027' },
    { id: '2027-03', label: 'Mar 1–27, 2027' },
    { id: 'beyond_mar27', label: 'After Mar 27 (Future)' },
  ];

  return (
    <div className="space-y-5">
      {/* Timeline Control Header */}
      <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F47521]" />
              <span>Chronological Simulcast Release Feed</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Showing <strong className="text-white">{filteredItems.length}</strong> scheduled
              episode drops across <strong className="text-white">{groupedDays.length}</strong> days
              in your local timezone.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMilestonesOnly(!milestonesOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                milestonesOnly
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>Premieres &amp; Finales Only</span>
            </button>

            <button
              onClick={() => setHideAlreadyAiredToday(!hideAlreadyAiredToday)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                hideAlreadyAiredToday
                  ? 'bg-[#F47521]/20 border-[#F47521]/50 text-[#F47521]'
                  : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-300 hover:text-white'
              }`}
            >
              {hideAlreadyAiredToday ? 'Hiding Earlier Today' : 'Include All of Today'}
            </button>

            {filteredItems.length > 0 && (
              <button
                onClick={() =>
                  exportEpisodesToIcs(
                    filteredItems.slice(0, 250),
                    titleLang,
                    'crunchyroll-timeline-to-mar27.ics'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-zinc-200 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#F47521]" />
                <span>Export Feed (.ICS)</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-[#2A2E3B]/70">
          {monthTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMonthScope(tab.id);
                setVisibleDaysLimit(25);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                monthScope === tab.id
                  ? 'bg-[#F47521] text-black border-[#F47521]'
                  : 'bg-[#0B0C10] text-zinc-400 border-[#2A2E3B] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day-by-Day Timeline Stream */}
      {visibleGroups.length === 0 ? (
        <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-12 text-center">
          <p className="text-zinc-400 text-sm">
            No scheduled episodes match your current filter in this date range.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map(({ date, items }) => {
            const isToday = isSameDay(date, now);
            const isMar27 =
              date.getFullYear() === 2027 && date.getMonth() === 2 && date.getDate() === 27;

            return (
              <div
                key={date.toISOString()}
                className={`rounded-2xl border overflow-hidden ${
                  isToday
                    ? 'bg-[#141519] border-[#F47521]'
                    : isMar27
                    ? 'bg-[#141519] border-[#2ABDBB]'
                    : 'bg-[#141519] border-[#2A2E3B]'
                }`}
              >
                {/* Sticky Day Banner */}
                <div
                  className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                    isToday
                      ? 'bg-gradient-to-r from-[#F47521]/20 to-transparent border-[#F47521]/40'
                      : isMar27
                      ? 'bg-gradient-to-r from-[#2ABDBB]/20 to-transparent border-[#2ABDBB]/40'
                      : 'bg-[#1B1D24] border-[#2A2E3B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {formatFullDayHeader(date)}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-[#F47521] text-black">
                        Today
                      </span>
                    )}
                    {isMar27 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-[#2ABDBB] text-black">
                        March 27 Milestone
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-400">
                    {items.length} {items.length === 1 ? ' episode release' : ' episode releases'}
                  </span>
                </div>

                {/* Day's Episodes */}
                <div className="divide-y divide-[#2A2E3B]/60">
                  {items.map(({ slot, show }) => {
                    const title = getDisplayTitle(show, titleLang);
                    const countdown = formatCountdown(slot.airingDate, now);
                    const inWatchlist = watchlist.has(show.id);

                    return (
                      <div
                        key={slot.id}
                        onClick={() => onSelectShow(show)}
                        className="p-3.5 sm:px-5 hover:bg-[#1B1D24] transition-colors flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 cursor-pointer"
                      >
                        {/* Left: Time + Countdown */}
                        <div className="flex items-center gap-3 w-full sm:w-44 shrink-0">
                          <div className="px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-center min-w-[92px]">
                            <div className="text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#F47521]" />
                              {formatTimeShort(slot.airingDate)}
                            </div>
                            <div
                              className={`text-[10px] font-bold mt-0.5 ${
                                countdown.isPast
                                  ? 'text-zinc-500'
                                  : countdown.isImminent
                                  ? 'text-[#F47521]'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {countdown.text}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-[#F47521]/20 text-[#F47521] border border-[#F47521]/30 text-center">
                              EP {slot.episodeNumber}
                            </span>
                            {slot.isConfirmed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                                <Sparkles className="w-3 h-3" /> Projected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Show Cover + Title + Weekly Cadence Info */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <img
                            src={show.coverImage.large}
                            alt={title}
                            loading="lazy"
                            className="w-12 h-16 object-cover rounded-lg shrink-0 border border-[#2A2E3B]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-white hover:text-[#F47521] transition-colors truncate">
                                {title}
                              </h3>
                              {slot.isPremiere && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  SEASON PREMIERE
                                </span>
                              )}
                              {slot.isFinale && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  SEASON FINALE
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {show.weeklyTimeLabel && (
                                <span>
                                  Weekly Slot:{' '}
                                  <strong className="text-zinc-200">{show.weeklyTimeLabel}</strong>
                                </span>
                              )}
                              {show.season && show.seasonYear && (
                                <span>
                                  • {show.season} {show.seasonYear}
                                </span>
                              )}
                              {show.genres.length > 0 && (
                                <span className="text-zinc-500">
                                  • {show.genres.slice(0, 3).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleWatchlist(show.id)}
                            className={`p-2 rounded-xl border transition-all ${
                              inWatchlist
                                ? 'bg-[#FAB818]/15 border-[#FAB818]/40 text-[#FAB818]'
                                : 'bg-[#0B0C10] border-[#2A2E3B] text-zinc-400 hover:text-white'
                            }`}
                            title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${inWatchlist ? 'fill-[#FAB818]' : ''}`}
                            />
                          </button>

                          <a
                            href={getGoogleCalendarUrl({ slot, show }, titleLang)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-zinc-400 hover:text-[#2ABDBB] hover:border-[#2ABDBB]/40 transition-all"
                            title="Add episode to Google Calendar"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </a>

                          <a
                            href={show.crunchyrollUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F47521] hover:bg-[#FF8533] text-black font-bold text-xs transition-all"
                          >
                            <span>Watch</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Load More Days Button */}
          {visibleDaysLimit < groupedDays.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleDaysLimit((prev) => prev + 30)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F47521] hover:bg-[#FF8533] text-black font-extrabold text-sm shadow-lg shadow-[#F47521]/20 transition-all"
              >
                <span>
                  Show More Days ({groupedDays.length - visibleDaysLimit} more days remaining up to
                  Mar 27+)
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
