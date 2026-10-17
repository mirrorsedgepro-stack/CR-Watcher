import { AnimeShow, EnrichedEpisodeItem, TitleLanguage } from '../types/anime';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function getDisplayTitle(show: AnimeShow, lang: TitleLanguage): string {
  if (lang === 'english') {
    return show.title.english || show.title.romaji;
  }
  return show.title.romaji || show.title.english || 'Untitled Anime';
}

export function exportEpisodesToIcs(
  items: EnrichedEpisodeItem[],
  lang: TitleLanguage,
  filename = 'crunchyroll-simulcast-schedule.ics'
): void {
  const nowStamp = formatIcsDate(new Date());
  const events = items.map(({ slot, show }) => {
    const title = getDisplayTitle(show, lang);
    const start = slot.airingDate;
    const durationMins = show.duration || 24;
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const statusTag = slot.isConfirmed ? 'Confirmed' : 'Projected';

    const summary = `${title} — Episode ${slot.episodeNumber} (${statusTag})`;
    const description = [
      `Show: ${title}`,
      `Episode: ${slot.episodeNumber}${show.episodes ? ` of ${show.episodes}` : ''}`,
      `Schedule Type: ${statusTag} Simulcast Slot`,
      `Watch on Crunchyroll: ${show.crunchyrollUrl}`,
    ].join('\n');

    return [
      'BEGIN:VEVENT',
      `UID:cr-simulcast-${show.id}-ep-${slot.episodeNumber}@crunchycast.local`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `URL:${show.crunchyrollUrl}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CrunchyCast//Simulcast Release Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(item: EnrichedEpisodeItem, lang: TitleLanguage): string {
  const { slot, show } = item;
  const title = getDisplayTitle(show, lang);
  const start = formatIcsDate(slot.airingDate);
  const durationMins = show.duration || 24;
  const end = formatIcsDate(new Date(slot.airingDate.getTime() + durationMins * 60 * 1000));
  const text = encodeURIComponent(`${title} - Episode ${slot.episodeNumber} (Crunchyroll)`);
  const details = encodeURIComponent(
    `Watch on Crunchyroll: ${show.crunchyrollUrl}\nStatus: ${
      slot.isConfirmed ? 'Confirmed Airing Time' : 'Projected Weekly Slot'
    }`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;
}
