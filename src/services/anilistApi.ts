import {
  AnimeShow,
  DisplayTimezone,
  EpisodeSlot,
  SimulcastOffsetMode,
} from '../types/anime';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const CACHE_KEY = 'crunchycast_anilist_raw_v2';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const MEDIA_FRAGMENT = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    color
  }
  bannerImage
  description(asHtml: false)
  season
  seasonYear
  status
  episodes
  duration
  genres
  averageScore
  popularity
  trailer {
    id
    site
    thumbnail
  }
  studios(isMain: true) {
    nodes {
      name
    }
  }
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  nextAiringEpisode {
    episode
    airingAt
  }
  airingSchedule(perPage: 25) {
    nodes {
      episode
      airingAt
    }
  }
  externalLinks {
    id
    url
    site
    type
    icon
    color
  }
`;

const COMBINED_QUERY = `
  query FetchSimulcastData {
    releasing1: Page(page: 1, perPage: 50) {
      media(type: ANIME, status: RELEASING, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
    releasing2: Page(page: 2, perPage: 50) {
      media(type: ANIME, status: RELEASING, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
    fall2026: Page(page: 1, perPage: 50) {
      media(type: ANIME, season: FALL, seasonYear: 2026, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
    winter2027_1: Page(page: 1, perPage: 50) {
      media(type: ANIME, season: WINTER, seasonYear: 2027, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
    winter2027_2: Page(page: 2, perPage: 50) {
      media(type: ANIME, season: WINTER, seasonYear: 2027, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
    spring2027: Page(page: 1, perPage: 35) {
      media(type: ANIME, season: SPRING, seasonYear: 2027, format_in: [TV, TV_SHORT, ONA], sort: POPULARITY_DESC, isAdult: false) {
        ${MEDIA_FRAGMENT}
      }
    }
  }
`;

const USER_LIST_QUERY = `
  query FetchUserAnimeList($userName: String!) {
    MediaListCollection(userName: $userName, type: ANIME, status_in: [CURRENT, PLANNING]) {
      lists {
        entries {
          mediaId
        }
      }
    }
  }
`;

interface RawMediaNode {
  id: number;
  title: {
    romaji: string;
    english: string | null;
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
  status: string;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number;
  trailer?: {
    id: string;
    site: string;
    thumbnail?: string | null;
  } | null;
  studios?: {
    nodes: { name: string }[];
  };
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
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
  } | null;
  airingSchedule?: {
    nodes: {
      episode: number;
      airingAt: number;
    }[];
  };
  externalLinks?: {
    id: number;
    url: string;
    site: string;
    type?: string;
    icon?: string;
    color?: string;
  }[];
}

const OTHER_STREAMING_SITES = new Set([
  'Netflix',
  'Disney Plus',
  'HIDIVE',
  'Hulu',
  'Amazon Prime Video',
  'Bilibili',
  'Bilibili TV',
  'YouTube',
]);

function stripHtmlTags(str: string | null): string | null {
  if (!str) return null;
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export async function fetchRawAnimeNodes(forceRefresh = false): Promise<{
  nodes: RawMediaNode[];
  fetchedAt: number;
  fromCache: boolean;
}> {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS && Array.isArray(parsed.nodes)) {
          return { nodes: parsed.nodes, fetchedAt: parsed.fetchedAt, fromCache: true };
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: COMBINED_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`AniList API returned HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.errors && !json.data) {
    throw new Error(json.errors[0]?.message || 'GraphQL Error fetching AniList schedule');
  }

  const pages = [
    json.data?.releasing1?.media || [],
    json.data?.releasing2?.media || [],
    json.data?.fall2026?.media || [],
    json.data?.winter2027_1?.media || [],
    json.data?.winter2027_2?.media || [],
    json.data?.spring2027?.media || [],
  ];

  const byId = new Map<number, RawMediaNode>();
  for (const list of pages) {
    for (const item of list) {
      if (item && item.id && !byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }

  const nodes = Array.from(byId.values());
  const fetchedAt = Date.now();

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ nodes, fetchedAt }));
  } catch {
    // ignore quota errors
  }

  return { nodes, fetchedAt, fromCache: false };
}

export async function fetchAniListUserWatchlist(userName: string): Promise<number[]> {
  const cleanName = userName.trim();
  if (!cleanName) {
    throw new Error('Please enter an AniList username.');
  }

  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: USER_LIST_QUERY,
      variables: { userName: cleanName },
    }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || `Could not find AniList user "${cleanName}"`);
  }

  const lists = json.data?.MediaListCollection?.lists || [];
  const ids = new Set<number>();
  for (const list of lists) {
    for (const entry of list.entries || []) {
      if (typeof entry.mediaId === 'number') {
        ids.add(entry.mediaId);
      }
    }
  }
  return Array.from(ids);
}

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const MAX_PROJECTION_UNIX = Math.floor(new Date('2027-05-15T23:59:59Z').getTime() / 1000);

export function buildAnimeShowCatalog(
  rawNodes: RawMediaNode[],
  offsetMode: SimulcastOffsetMode,
  customShowOffsetsHours: Record<number, number>,
  displayTimezone: DisplayTimezone = 'local'
): AnimeShow[] {
  // Base offset:
  // - cr_plus_1h: +1 hour after JP broadcast
  // - jp_broadcast: 0 hours
  // - dub_est_2w: +14 days + 1 hour (standard 2-week English Simuldub delay)
  const baseOffsetSeconds =
    offsetMode === 'cr_plus_1h'
      ? 3600
      : offsetMode === 'dub_est_2w'
      ? 14 * 24 * 3600 + 3600
      : 0;

  const shows: AnimeShow[] = [];

  for (const raw of rawNodes) {
    const links = raw.externalLinks || [];
    const crLink = links.find((l) => l.site.toLowerCase().includes('crunchyroll'));
    const isCrunchyrollConfirmed = Boolean(crLink);

    const hasWesternRivalOnly =
      !isCrunchyrollConfirmed &&
      links.some((l) =>
        ['Netflix', 'Disney Plus', 'HIDIVE', 'Hulu', 'Amazon Prime Video'].includes(l.site)
      );

    const isChineseOnlyOna =
      !isCrunchyrollConfirmed &&
      links.length > 0 &&
      links.every((l) =>
        ['Bilibili', 'Bilibili TV', 'iQ', 'WeTV', 'Tencent Video', 'Youku'].includes(l.site)
      );

    if (hasWesternRivalOnly || isChineseOnlyOna) {
      continue;
    }

    const customOffsetHours = customShowOffsetsHours[raw.id] ?? 0;
    const totalOffsetSeconds = baseOffsetSeconds + customOffsetHours * 3600;

    const confirmedMap = new Map<number, number>();
    if (raw.airingSchedule?.nodes) {
      for (const node of raw.airingSchedule.nodes) {
        if (node && typeof node.episode === 'number' && typeof node.airingAt === 'number') {
          confirmedMap.set(node.episode, node.airingAt);
        }
      }
    }
    if (
      raw.nextAiringEpisode &&
      typeof raw.nextAiringEpisode.episode === 'number' &&
      typeof raw.nextAiringEpisode.airingAt === 'number'
    ) {
      confirmedMap.set(raw.nextAiringEpisode.episode, raw.nextAiringEpisode.airingAt);
    }

    const confirmedEntries = Array.from(confirmedMap.entries()).sort((a, b) => a[0] - b[0]);

    const scheduleSlots: EpisodeSlot[] = [];

    for (const [epNum, rawTime] of confirmedEntries) {
      const adjustedMs = (rawTime + totalOffsetSeconds) * 1000;
      scheduleSlots.push({
        id: `${raw.id}-ep-${epNum}`,
        showId: raw.id,
        episodeNumber: epNum,
        rawAiringAt: rawTime,
        airingDate: new Date(adjustedMs),
        isConfirmed: offsetMode !== 'dub_est_2w',
        isPremiere: epNum === 1,
        isFinale: raw.episodes != null && epNum === raw.episodes,
      });
    }

    if (confirmedEntries.length > 0) {
      const [lastEpNum, lastRawTime] = confirmedEntries[confirmedEntries.length - 1];
      const isLongRunning = lastEpNum > 24 || (raw.episodes != null && raw.episodes > 36);
      const targetMaxEpisodes = isLongRunning
        ? lastEpNum + 35
        : raw.episodes != null
        ? raw.episodes
        : Math.max(12, lastEpNum);

      let nextEp = lastEpNum + 1;
      let nextRawTime = lastRawTime + WEEK_SECONDS;

      while (nextEp <= targetMaxEpisodes && nextRawTime <= MAX_PROJECTION_UNIX) {
        const adjustedMs = (nextRawTime + totalOffsetSeconds) * 1000;
        scheduleSlots.push({
          id: `${raw.id}-ep-${nextEp}-proj`,
          showId: raw.id,
          episodeNumber: nextEp,
          rawAiringAt: nextRawTime,
          airingDate: new Date(adjustedMs),
          isConfirmed: false,
          isPremiere: nextEp === 1,
          isFinale: !isLongRunning && nextEp === targetMaxEpisodes,
        });
        nextEp += 1;
        nextRawTime += WEEK_SECONDS;
      }
    } else if (
      raw.startDate?.year &&
      raw.startDate?.month &&
      raw.startDate?.day &&
      raw.status === 'NOT_YET_RELEASED'
    ) {
      const isoDateStr = `${raw.startDate.year}-${String(raw.startDate.month).padStart(
        2,
        '0'
      )}-${String(raw.startDate.day).padStart(2, '0')}T14:00:00Z`;
      const startUnix = Math.floor(new Date(isoDateStr).getTime() / 1000);
      if (!Number.isNaN(startUnix) && startUnix <= MAX_PROJECTION_UNIX) {
        const totalEps = raw.episodes || 12;
        for (let ep = 1; ep <= totalEps; ep++) {
          const epRawUnix = startUnix + (ep - 1) * WEEK_SECONDS;
          if (epRawUnix > MAX_PROJECTION_UNIX) break;
          const adjustedMs = (epRawUnix + totalOffsetSeconds) * 1000;
          scheduleSlots.push({
            id: `${raw.id}-ep-${ep}-proj-date`,
            showId: raw.id,
            episodeNumber: ep,
            rawAiringAt: epRawUnix,
            airingDate: new Date(adjustedMs),
            isConfirmed: false,
            isPremiere: ep === 1,
            isFinale: ep === totalEps,
          });
        }
      }
    }

    scheduleSlots.sort((a, b) => a.airingDate.getTime() - b.airingDate.getTime());

    const nowMs = Date.now();
    const referenceSlot =
      scheduleSlots.find((s) => s.airingDate.getTime() >= nowMs) ||
      scheduleSlots[scheduleSlots.length - 1] ||
      null;

    let weeklyDayIndex: number | null = null;
    let weeklyTimeLabel: string | null = null;

    if (referenceSlot) {
      weeklyDayIndex = referenceSlot.airingDate.getDay();
      const tzOpt = displayTimezone !== 'local' ? { timeZone: displayTimezone } : {};
      const dayName = referenceSlot.airingDate.toLocaleDateString(undefined, {
        weekday: 'long',
        ...tzOpt,
      });
      const timeStr = referenceSlot.airingDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        ...tzOpt,
      });
      weeklyTimeLabel = `${dayName}s at ${timeStr}`;
    }

    const finaleSlot = scheduleSlots.find((s) => s.isFinale) || null;

    const searchTitle = encodeURIComponent(raw.title.english || raw.title.romaji);
    const crunchyrollUrl =
      crLink?.url &&
      crLink.url !== 'https://crunchyroll.com' &&
      crLink.url !== 'https://www.crunchyroll.com/'
        ? crLink.url
        : `https://www.crunchyroll.com/search?q=${searchTitle}`;

    const otherStreamingLinks = links.filter((l) => OTHER_STREAMING_SITES.has(l.site));

    shows.push({
      id: raw.id,
      title: {
        english: raw.title.english,
        romaji: raw.title.romaji,
        native: raw.title.native,
      },
      coverImage: {
        extraLarge: raw.coverImage?.extraLarge || raw.coverImage?.large || '',
        large: raw.coverImage?.large || '',
        color: raw.coverImage?.color || null,
      },
      bannerImage: raw.bannerImage || null,
      description: stripHtmlTags(raw.description),
      season: raw.season,
      seasonYear: raw.seasonYear,
      status: raw.status,
      episodes: raw.episodes,
      duration: raw.duration,
      genres: raw.genres || [],
      averageScore: raw.averageScore,
      popularity: raw.popularity || 0,
      studios: raw.studios?.nodes?.map((n) => n.name) || [],
      trailer:
        raw.trailer && raw.trailer.id && raw.trailer.site
          ? {
              id: raw.trailer.id,
              site: raw.trailer.site.toLowerCase(),
              thumbnail: raw.trailer.thumbnail || null,
            }
          : null,
      startDate: raw.startDate || { year: null, month: null, day: null },
      endDate: raw.endDate || { year: null, month: null, day: null },
      isCrunchyrollConfirmed,
      crunchyrollUrl,
      otherStreamingLinks,
      scheduleSlots,
      hasKnownWeeklyTime: scheduleSlots.length > 0,
      weeklyDayIndex,
      weeklyTimeLabel,
      finaleSlot,
    });
  }

  return shows.sort((a, b) => b.popularity - a.popularity);
}
