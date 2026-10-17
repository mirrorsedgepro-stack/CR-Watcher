import React from 'react';
import {
  Clock,
  Calendar,
  Bookmark,
  ExternalLink,
  Star,
  CheckCircle2,
  Sparkles,
  Tv,
  Info,
} from 'lucide-react';
import {
  AnimeShow,
  FilterState,
  TitleLanguage,
} from '../types/anime';
import {
  formatCountdown,
  formatDateShort,
  formatDateWithYear,
  formatFuzzyDate,
  formatTimeShort,
} from '../utils/dateUtils';
import { getDisplayTitle } from '../utils/calendarExport';

interface ShowCatalogViewProps {
  shows: AnimeShow[];
  now: Date;
  titleLang: TitleLanguage;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  watchlist: Set<number>;
  toggleWatchlist: (showId: number) => void;
  onSelectShow: (show: AnimeShow) => void;
}

const DAYS_OF_WEEK = [
  { index: 'all' as const, label: 'All Days' },
  { index: 1, label: 'Mondays' },
  { index: 2, label: 'Tuesdays' },
  { index: 3, label: 'Wednesdays' },
  { index: 4, label: 'Thursdays' },
  { index: 5, label: 'Fridays' },
  { index: 6, label: 'Saturdays' },
  { index: 0, label: 'Sundays' },
];

export const ShowCatalogView: React.FC<ShowCatalogViewProps> = ({
  shows,
  now,
  titleLang,
  filters,
  setFilters,
  watchlist,
  toggleWatchlist,
  onSelectShow,
}) => {
  // Split into shows with known weekly schedule slots vs upcoming TBA shows
  const scheduledShows = shows.filter((s) => {
    if (!s.hasKnownWeeklyTime) return false;
    if (filters.selectedDay !== 'all' && s.weeklyDayIndex !== filters.selectedDay) {
      return false;
    }
    return true;
  });

  const upcomingTbaShows = shows.filter((s) => !s.hasKnownWeeklyTime);

  return (
    <div className="space-y-8">
      {/* Day-of-Week Filter Bar */}
      <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-[#F47521]" />
            <span>What&apos;s On: Simulcast Shows (Today → March 27, 2027)</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Browse every active and upcoming anime series, their weekly showing times, and
            associated episode release dates.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={String(d.index)}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  selectedDay: d.index,
                }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                filters.selectedDay === d.index
                  ? 'bg-[#F47521] text-black border-[#F47521]'
                  : 'bg-[#0B0C10] text-zinc-400 border-[#2A2E3B] hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Shows with Active/Scheduled Weekly Times */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F47521]" />
            <span>Active &amp; Scheduled Weekly Simulcasts ({scheduledShows.length})</span>
          </h3>
        </div>

        {scheduledShows.length === 0 ? (
          <div className="bg-[#141519] border border-[#2A2E3B] rounded-2xl p-10 text-center text-sm text-zinc-400">
            No scheduled shows match the current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scheduledShows.map((show) => {
              const title = getDisplayTitle(show, titleLang);
              const inWatchlist = watchlist.has(show.id);

              const upcomingSlots = show.scheduleSlots.filter(
                (slot) => slot.airingDate.getTime() >= now.getTime()
              );
              const nextSlot = upcomingSlots[0] || null;
              const firstSlot = show.scheduleSlots[0] || null;
              const lastSlot = show.scheduleSlots[show.scheduleSlots.length - 1] || null;
              const nextCountdown = nextSlot ? formatCountdown(nextSlot.airingDate, now) : null;

              return (
                <div
                  key={show.id}
                  onClick={() => onSelectShow(show)}
                  className="group bg-[#141519] hover:bg-[#1B1D24] border border-[#2A2E3B] hover:border-[#F47521]/60 rounded-2xl overflow-hidden flex flex-col transition-all cursor-pointer shadow-lg"
                >
                  {/* Card Top: Cover + Key Metadata */}
                  <div className="p-4 flex gap-4 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={show.coverImage.extraLarge || show.coverImage.large}
                        alt={title}
                        loading="lazy"
                        className="w-24 h-36 object-cover rounded-xl border border-[#2A2E3B] bg-zinc-900"
                      />
                      {show.averageScore && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-extrabold text-[#FAB818] flex items-center gap-0.5 border border-[#FAB818]/30">
                          <Star className="w-2.5 h-2.5 fill-[#FAB818]" />
                          {show.averageScore}%
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {show.isCrunchyrollConfirmed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#F47521]/15 text-[#F47521] border border-[#F47521]/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> CR Simulcast
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Likely CR
                            </span>
                          )}

                          {show.season && show.seasonYear && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B0C10] text-zinc-300 border border-[#2A2E3B]">
                              {show.season} {show.seasonYear}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#F47521] transition-colors line-clamp-2 leading-snug">
                          {title}
                        </h4>

                        {/* Weekly Showing Time Highlight */}
                        {show.weeklyTimeLabel && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-xs font-bold text-[#F47521]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{show.weeklyTimeLabel}</span>
                          </div>
                        )}

                        {/* Release Run Dates */}
                        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>
                            Run:{' '}
                            <strong className="text-zinc-200">
                              {firstSlot
                                ? formatDateWithYear(firstSlot.airingDate)
                                : formatFuzzyDate(show.startDate)}
                            </strong>{' '}
                            →{' '}
                            <strong className="text-zinc-200">
                              {lastSlot ? formatDateWithYear(lastSlot.airingDate) : 'Ongoing'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Genres */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {show.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0B0C10] text-zinc-400 border border-[#2A2E3B]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Episode Releases Strip */}
                  <div className="px-4 py-3 bg-[#0B0C10]/80 border-t border-[#2A2E3B] space-y-2">
                    {nextSlot && nextCountdown ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white">
                            Next: EP {nextSlot.episodeNumber}
                          </span>
                          <span className="text-zinc-400">
                            • {formatDateShort(nextSlot.airingDate)} at{' '}
                            {formatTimeShort(nextSlot.airingDate)}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#F47521]/20 text-[#F47521] font-bold text-[11px]">
                          {nextCountdown.text}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">All scheduled episodes aired</div>
                    )}

                    {/* Next 3 Episode Date Pills */}
                    {upcomingSlots.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
                        {upcomingSlots.slice(0, 4).map((slot) => (
                          <span
                            key={slot.id}
                            className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${
                              slot.isConfirmed
                                ? 'bg-[#141519] border-emerald-500/30 text-emerald-300'
                                : 'bg-[#141519] border-amber-500/30 text-amber-200/90'
                            }`}
                          >
                            Ep {slot.episodeNumber}: {formatDateShort(slot.airingDate)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div
                      className="pt-2 border-t border-[#2A2E3B]/60 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectShow(show)}
                        className="text-xs font-bold text-zinc-300 hover:text-[#F47521] flex items-center gap-1 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5 text-[#F47521]" />
                        <span>View All {show.scheduleSlots.length} Episode Dates</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleWatchlist(show.id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            inWatchlist
                              ? 'bg-[#FAB818]/15 border-[#FAB818]/40 text-[#FAB818]'
                              : 'bg-[#141519] border-[#2A2E3B] text-zinc-400 hover:text-white'
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
                          className="px-2.5 py-1 rounded-lg bg-[#F47521] hover:bg-[#FF8533] text-black font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <span>CR</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Dedicated Section for Upcoming Winter 2027 / Spring 2027 Shows Without Exact Weekly Broadcast Times Yet */}
      {upcomingTbaShows.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-[#2A2E3B]">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>
                Upcoming 2027 Simulcasts — Premiere Window Announced (Exact Weekly Time TBA) (
                {upcomingTbaShows.length})
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              These series are confirmed for the Jan–Mar 2027 window, but Japanese broadcasters
              haven&apos;t published their exact weekly hour yet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {upcomingTbaShows.map((show) => {
              const title = getDisplayTitle(show, titleLang);
              const inWatchlist = watchlist.has(show.id);

              return (
                <div
                  key={show.id}
                  onClick={() => onSelectShow(show)}
                  className="group bg-[#141519] hover:bg-[#1B1D24] border border-[#2A2E3B] hover:border-amber-400/50 rounded-2xl p-3.5 flex gap-3.5 transition-all cursor-pointer"
                >
                  <img
                    src={show.coverImage.large}
                    alt={title}
                    loading="lazy"
                    className="w-20 h-28 object-cover rounded-xl shrink-0 border border-[#2A2E3B] bg-zinc-900"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        {show.isCrunchyrollConfirmed ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#F47521]/15 text-[#F47521] border border-[#F47521]/30">
                            Confirmed CR
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Likely CR
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Premiere: {formatFuzzyDate(show.startDate)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F47521] transition-colors line-clamp-2">
                        {title}
                      </h4>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t border-[#2A2E3B]/60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-zinc-400">
                        {show.episodes ? `${show.episodes} Episodes` : 'Weekly Time TBA'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleWatchlist(show.id)}
                          className={`p-1 rounded hover:bg-[#0B0C10] ${
                            inWatchlist ? 'text-[#FAB818]' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-[#FAB818]' : ''}`}
                          />
                        </button>
                        <a
                          href={show.crunchyrollUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-[#0B0C10] text-zinc-400 hover:text-[#F47521]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
