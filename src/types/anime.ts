export type ViewMode = 'weekly' | 'timeline' | 'catalog';

export type TitleLanguage = 'english' | 'romaji';

export type SimulcastOffsetMode = 'cr_plus_1h' | 'jp_broadcast';

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  type?: string;
  icon?: string;
  color?: string;
}

export interface EpisodeSlot {
  id: string;
  showId: number;
  episodeNumber: number;
  /** Raw unix timestamp (seconds) from AniList (JP broadcast time) */
  rawAiringAt: number;
  /** Adjusted Date object including simulcast offset + any per-show custom offset */
  airingDate: Date;
  /** True if directly in AniList's confirmed airingSchedule, false if projected weekly */
  isConfirmed: boolean;
  isPremiere?: boolean;
  isFinale?: boolean;
}

export interface AnimeShow {
  id: number;
  title: {
    english: string | null;
    romaji: string;
    native: string | null;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  bannerImage: string | null;
  description: string | null;
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  seasonYear: number | null;
  status: 'RELEASING' | 'NOT_YET_RELEASED' | 'FINISHED' | string;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  studios: string[];
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  /** True if AniList externalLinks explicitly includes Crunchyroll */
  isCrunchyrollConfirmed: boolean;
  /** Direct URL to Crunchyroll page if available, otherwise search URL */
  crunchyrollUrl: string;
  otherStreamingLinks: ExternalLink[];
  /** All confirmed + projected episode slots */
  scheduleSlots: EpisodeSlot[];
  /** True if we have a weekly day/time slot (either from confirmed schedule or full startDate with time) */
  hasKnownWeeklyTime: boolean;
  /** Day of week in user's local timezone (0 = Sun ... 6 = Sat) for its regular slot */
  weeklyDayIndex: number | null;
  /** Formatted local weekly slot string, e.g., "Saturdays at 2:00 AM" */
  weeklyTimeLabel: string | null;
}

export interface EnrichedEpisodeItem {
  slot: EpisodeSlot;
  show: AnimeShow;
}

export interface FilterState {
  search: string;
  selectedGenre: string;
  selectedDay: number | 'all'; // 0-6 or 'all'
  includeUnassignedUpcoming: boolean;
  watchlistOnly: boolean;
  statusFilter: 'all' | 'confirmed' | 'projected';
  seasonFilter: 'all' | 'FALL_2026' | 'WINTER_2027';
}
