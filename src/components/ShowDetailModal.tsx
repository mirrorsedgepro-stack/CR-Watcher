import React, { useState } from 'react';
import {
  X,
  Clock,
  Calendar,
  Bookmark,
  ExternalLink,
  Download,
  CheckCircle2,
  Sparkles,
  Star,
  CalendarPlus,
  Sliders,
  Check,
  CheckCheck,
  Film,
} from 'lucide-react';
import {
  AnimeShow,
  DisplayTimezone,
  TitleLanguage,
} from '../types/anime';
import {
  formatCountdown,
  formatFullDayHeader,
  formatFuzzyDate,
  formatTimeShort,
} from '../utils/dateUtils';
import {
  exportEpisodesToIcs,
  getDisplayTitle,
  getGoogleCalendarUrl,
} from '../utils/calendarExport';

interface ShowDetailModalProps {
  show: AnimeShow | null;
  onClose: () => void;
  now: Date;
  titleLang: TitleLanguage;
  displayTimezone: DisplayTimezone;
  watchlist: Set<number>;
  toggleWatchlist: (showId: number) => void;
  watchedEpisodeNums: Set<number>;
  onToggleEpisodeWatched: (showId: number, episodeNumber: number) => void;
  onMarkUpToEpisodeWatched: (showId: number, upToEpisode: number) => void;
  customOffsetHours: number;
  setCustomShowOffset: (showId: number, hours: number) => void;
}

export const ShowDetailModal: React.FC<ShowDetailModalProps> = ({
  show,
  onClose,
  now,
  titleLang,
  displayTimezone,
  watchlist,
  toggleWatchlist,
  watchedEpisodeNums,
  onToggleEpisodeWatched,
  onMarkUpToEpisodeWatched,
  customOffsetHours,
  setCustomShowOffset,
}) => {
  const [showTrailer, setShowTrailer] = useState(false);

  if (!show) return null;

  const title = getDisplayTitle(show, titleLang);
  const secondaryTitle =
    titleLang === 'english' && show.title.romaji !== title
      ? show.title.romaji
      : show.title.english && show.title.english !== title
      ? show.title.english
      : show.title.native;

  const inWatchlist = watchlist.has(show.id);

  const handleExportShowIcs = () => {
    const items = show.scheduleSlots.map((slot) => ({ slot, show }));
    const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    exportEpisodesToIcs(items, titleLang, `${safeSlug}-schedule.ics`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#141519] border-t sm:border border-[#2A2E3B] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl sm:my-auto max-h-[92dvh] sm:max-h-[90vh] flex flex-col pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-[#1B1D24] via-[#232630] to-[#141519] shrink-0">
          {show.bannerImage ? (
            <img
              src={show.bannerImage}
              alt={title}
              className="w-full h-full object-cover opacity-45"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F47521]/25 via-[#141519] to-[#2ABDBB]/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141519] via-[#141519]/50 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-[#F47521] text-white hover:text-black transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 -mt-16 relative z-10">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={show.coverImage.extraLarge || show.coverImage.large}
              alt={title}
              className="w-28 sm:w-36 h-40 sm:h-52 object-cover rounded-2xl border-2 border-[#2A2E3B] shadow-xl shrink-0 bg-zinc-900"
            />

            <div className="flex-1 space-y-3 pt-2 sm:pt-10">
              <div className="flex flex-wrap items-center gap-2">
                {show.isCrunchyrollConfirmed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#F47521] text-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Crunchyroll Simulcast
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Likely / Unassigned Simulcast
                  </span>
                )}

                {show.season && show.seasonYear && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0B0C10] text-zinc-300 border border-[#2A2E3B]">
                    {show.season} {show.seasonYear}
                  </span>
                )}

                {show.averageScore && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0B0C10] text-[#FAB818] border border-[#FAB818]/40 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#FAB818]" /> {show.averageScore}% Score
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {title}
                </h2>
                {secondaryTitle && (
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{secondaryTitle}</p>
                )}
              </div>

              {/* Weekly Slot & Metadata Pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {show.weeklyTimeLabel ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F47521]/15 border border-[#F47521]/40 text-[#F47521] font-extrabold">
                    <Clock className="w-4 h-4" />
                    <span>Weekly Showing: {show.weeklyTimeLabel}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>Premiere Window: {formatFuzzyDate(show.startDate)} (Exact Time TBA)</span>
                  </div>
                )}

                {show.studios.length > 0 && (
                  <span className="px-3 py-1.5 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-zinc-300">
                    Studio: <strong className="text-white">{show.studios.join(', ')}</strong>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={show.crunchyrollUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F47521] hover:bg-[#FF8533] text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[#F47521]/20 transition-all"
                >
                  <span>Watch on Crunchyroll</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => toggleWatchlist(show.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                    inWatchlist
                      ? 'bg-[#FAB818] text-black border-[#FAB818]'
                      : 'bg-[#1B1D24] text-zinc-200 border-[#2A2E3B] hover:border-[#FAB818]'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-black' : ''}`} />
                  <span>{inWatchlist ? 'In My Watchlist' : 'Add to Watchlist'}</span>
                </button>

                {show.trailer && show.trailer.site === 'youtube' && (
                  <button
                    onClick={() => setShowTrailer(!showTrailer)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs sm:text-sm font-bold transition-all"
                  >
                    <Film className="w-4 h-4" />
                    <span>{showTrailer ? 'Hide Trailer' : 'Watch Trailer'}</span>
                  </button>
                )}

                {show.scheduleSlots.length > 0 && (
                  <button
                    onClick={handleExportShowIcs}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-zinc-200 text-xs sm:text-sm font-semibold transition-all"
                  >
                    <Download className="w-4 h-4 text-[#2ABDBB]" />
                    <span>Export .ICS</span>
                  </button>
                )}
              </div>

              {/* Additional Streaming Links Matrix */}
              {show.otherStreamingLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-zinc-500">Also listed on:</span>
                  {show.otherStreamingLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded bg-[#0B0C10] border border-[#2A2E3B] text-zinc-300 hover:text-white hover:border-zinc-500 flex items-center gap-1"
                    >
                      <span>{link.site}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Embedded YouTube Trailer */}
          {showTrailer && show.trailer && show.trailer.site === 'youtube' && (
            <div className="rounded-2xl overflow-hidden border border-[#2A2E3B] bg-black aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${show.trailer.id}?autoplay=1`}
                title={`${title} Official Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Per-Show Custom Simulcast Offset Control */}
          <div className="bg-[#0B0C10] border border-[#2A2E3B] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Sliders className="w-4 h-4 text-[#F47521]" />
              <span>
                <strong>Custom Show Time Adjustment:</strong> Fine-tune this show&apos;s Crunchyroll
                drop offset if it differs from the default.
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[-1, 0, 1, 2, 3].map((hr) => (
                <button
                  key={hr}
                  onClick={() => setCustomShowOffset(show.id, hr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    customOffsetHours === hr
                      ? 'bg-[#F47521] text-black border-[#F47521]'
                      : 'bg-[#141519] text-zinc-400 border-[#2A2E3B] hover:text-white'
                  }`}
                >
                  {hr === 0 ? 'Default' : hr > 0 ? `+${hr}h` : `${hr}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          {show.description && (
            <div className="bg-[#1B1D24]/60 border border-[#2A2E3B] rounded-xl p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Synopsis
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {show.description}
              </p>
            </div>
          )}

          {/* Complete Episode Release Schedule Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F47521]" />
                <span>
                  Episode Release Dates &amp; Weekly Showing Times ({show.scheduleSlots.length}{' '}
                  Episodes • {watchedEpisodeNums.size} Watched)
                </span>
              </h3>
            </div>

            {show.scheduleSlots.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-center text-xs text-zinc-400">
                Exact episode dates have not been announced yet. Scheduled premiere window:{' '}
                <strong className="text-white">{formatFuzzyDate(show.startDate)}</strong>.
              </div>
            ) : (
              <div className="border border-[#2A2E3B] rounded-xl overflow-hidden bg-[#0B0C10]">
                <div className="max-h-80 overflow-y-auto divide-y divide-[#2A2E3B]/60">
                  {show.scheduleSlots.map((slot) => {
                    const countdown = formatCountdown(slot.airingDate, now);
                    const isWatched = watchedEpisodeNums.has(slot.episodeNumber);

                    return (
                      <div
                        key={slot.id}
                        className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
                          isWatched
                            ? 'bg-emerald-950/15 opacity-70'
                            : countdown.isPast
                            ? 'opacity-80 bg-[#0B0C10]'
                            : 'bg-[#141519]/60 hover:bg-[#1B1D24]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleEpisodeWatched(show.id, slot.episodeNumber)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isWatched
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'bg-[#141519] border-[#2A2E3B] text-zinc-500 hover:border-emerald-400 hover:text-emerald-400'
                            }`}
                            title={isWatched ? 'Watched (Click to unmark)' : 'Mark episode watched'}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <span className="px-2.5 py-1 rounded-lg font-extrabold bg-[#F47521]/20 text-[#F47521] border border-[#F47521]/30 min-w-[58px] text-center">
                            EP {slot.episodeNumber}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{formatFullDayHeader(slot.airingDate, displayTimezone)}</span>
                              {isWatched && (
                                <span className="text-[10px] font-extrabold text-emerald-400 uppercase">
                                  ✓ Watched
                                </span>
                              )}
                            </div>
                            <div className="text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>
                                Showing Time:{' '}
                                <strong className="text-[#F47521]">
                                  {formatTimeShort(slot.airingDate, displayTimezone)}
                                </strong>
                              </span>
                              {slot.isPremiere && (
                                <span className="text-emerald-400 font-bold">• Premiere</span>
                              )}
                              {slot.isFinale && (
                                <span className="text-amber-400 font-bold">• Finale</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {!isWatched && slot.episodeNumber > 1 && (
                            <button
                              onClick={() =>
                                onMarkUpToEpisodeWatched(show.id, slot.episodeNumber)
                              }
                              className="px-2 py-1 rounded bg-[#1B1D24] hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-300 border border-[#2A2E3B] text-[10px] font-semibold flex items-center gap-1 transition-all"
                              title={`Mark Episodes 1 through ${slot.episodeNumber} as watched`}
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>1–{slot.episodeNumber}</span>
                            </button>
                          )}

                          {slot.isConfirmed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                              <Sparkles className="w-3 h-3" /> Projected
                            </span>
                          )}

                          <span
                            className={`min-w-[82px] text-right font-bold ${
                              countdown.isPast ? 'text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {countdown.text}
                          </span>

                          <a
                            href={getGoogleCalendarUrl({ slot, show }, titleLang)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-zinc-300 hover:text-[#2ABDBB]"
                            title="Add to Google Calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
