import { EnrichedEpisodeItem, TitleLanguage } from '../types/anime';
import { getDisplayTitle } from './calendarExport';

const NOTIFIED_STORAGE_KEY = 'crunchycast_notified_episodes_v1';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    new Notification('CrunchyCast Notifications Enabled!', {
      body: 'You will receive alerts 15 minutes before and when your Watchlist simulcasts go live.',
      icon: '/favicon.svg',
    });
    return true;
  }
  return false;
}

export function checkAndFireWatchlistNotifications(
  watchlistEpisodes: EnrichedEpisodeItem[],
  now: Date,
  titleLang: TitleLanguage
): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  let notifiedSet: Set<string>;
  try {
    const raw = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    notifiedSet = raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    notifiedSet = new Set();
  }

  let updated = false;

  for (const { slot, show } of watchlistEpisodes) {
    const diffMinutes = (slot.airingDate.getTime() - now.getTime()) / 60000;
    const title = getDisplayTitle(show, titleLang);

    // 1. 15-minute heads-up window (between 1 and 15 mins before drop)
    const headsUpKey = `${slot.id}-15m`;
    if (diffMinutes > 1 && diffMinutes <= 15 && !notifiedSet.has(headsUpKey)) {
      new Notification(`Up Next in ${Math.round(diffMinutes)}m: ${title}`, {
        body: `Episode ${slot.episodeNumber} drops soon on Crunchyroll!`,
        icon: show.coverImage.large || '/favicon.svg',
      });
      notifiedSet.add(headsUpKey);
      updated = true;
    }

    // 2. Just dropped window (between -5 and +1 mins)
    const liveKey = `${slot.id}-live`;
    if (diffMinutes >= -5 && diffMinutes <= 1 && !notifiedSet.has(liveKey)) {
      new Notification(`NOW LIVE: ${title} — Episode ${slot.episodeNumber}`, {
        body: `Episode ${slot.episodeNumber} is now available on Crunchyroll.`,
        icon: show.coverImage.large || '/favicon.svg',
      });
      notifiedSet.add(liveKey);
      updated = true;
    }
  }

  if (updated) {
    try {
      localStorage.setItem(
        NOTIFIED_STORAGE_KEY,
        JSON.stringify(Array.from(notifiedSet).slice(-300))
      );
    } catch {
      // ignore storage errors
    }
  }
}
