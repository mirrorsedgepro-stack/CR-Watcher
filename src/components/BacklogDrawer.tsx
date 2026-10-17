import React from 'react';
import {
  X,
  Check,
  CheckCheck,
  ExternalLink,
  Clock,
  Inbox,
  PlayCircle,
} from 'lucide-react';
import {
  AnimeShow,
  DisplayTimezone,
  EnrichedEpisodeItem,
  TitleLanguage,
} from '../types/anime';
import {
  formatCountdown,
  formatDateShort,
  formatTimeShort,
} from '../utils/dateUtils';
import { getDisplayTitle } from '../utils/calendarExport';

interface BacklogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  backlogItems: EnrichedEpisodeItem[];
  now: Date;
  titleLang: TitleLanguage;
  displayTimezone: DisplayTimezone;
  onToggleWatched: (showId: number, episodeNumber: number) => void;
  onMarkAllBacklogWatched: () => void;
  onSelectShow: (show: AnimeShow) => void;
}

export const BacklogDrawer: React.FC<BacklogDrawerProps> = ({
  isOpen,
  onClose,
  backlogItems,
  now,
  titleLang,
  displayTimezone,
  onToggleWatched,
  onMarkAllBacklogWatched,
  onSelectShow,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141519] border-l border-[#2A2E3B] h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#2A2E3B] flex items-center justify-between bg-[#1B1D24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F47521]/20 text-[#F47521]">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Unwatched Watchlist Backlog ({backlogItems.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Aired episodes from your Watchlist waiting to be watched
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#0B0C10]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-bar actions */}
        {backlogItems.length > 0 && (
          <div className="px-4 py-2.5 bg-[#0B0C10] border-b border-[#2A2E3B] flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Check off episodes as you finish watching them
            </span>
            <button
              onClick={onMarkAllBacklogWatched}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Caught Up</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {backlogItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Inbox className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-sm font-bold text-zinc-300">
                You&apos;re 100% caught up!
              </div>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Add shows to your Watchlist with the bookmark icon. Whenever new episodes air,
                they will appear here until you mark them watched.
              </p>
            </div>
          ) : (
            backlogItems.map(({ slot, show }) => {
              const title = getDisplayTitle(show, titleLang);
              const countdown = formatCountdown(slot.airingDate, now);

              return (
                <div
                  key={slot.id}
                  onClick={() => onSelectShow(show)}
                  className="bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={show.coverImage.large}
                      alt={title}
                      className="w-11 h-16 object-cover rounded-lg shrink-0 border border-[#2A2E3B]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#F47521]/20 text-[#F47521]">
                          EP {slot.episodeNumber}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          { countdown.text }
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                        {title}
                      </h4>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#F47521]" />
                        <span>
                          {formatDateShort(slot.airingDate, displayTimezone)} •{' '}
                          {formatTimeShort(slot.airingDate, displayTimezone)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={show.crunchyrollUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#0B0C10] border border-[#2A2E3B] text-zinc-300 hover:text-[#F47521] hover:border-[#F47521]"
                      title="Watch on Crunchyroll"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onToggleWatched(show.id, slot.episodeNumber)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all"
                      title="Mark episode as watched"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Watched</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
