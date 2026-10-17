// Vercel Serverless Function: Dynamic Live Webcal (.ICS) Calendar Feed
// Automatically reads the visitor's cookie (`crunchycast_visitor_id` & `cc_wl_<visitorId>`)
// or accepts explicit `?shows=195516,189323&vid=ccv_...`

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const WEEK_SECONDS = 7 * 24 * 60 * 60;
const MAX_PROJECTION_UNIX = Math.floor(new Date('2027-05-15T23:59:59Z').getTime() / 1000);

function parseCookies(cookieHeader) {
  const map = {};
  if (!cookieHeader) return map;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const k = decodeURIComponent(part.slice(0, eqIdx).trim());
    const v = decodeURIComponent(part.slice(eqIdx + 1).trim());
    map[k] = v;
  }
  return map;
}

function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export default async function handler(req, res) {
  try {
    const cookies = parseCookies(req.headers?.cookie);
    const visitorId = req.query?.vid || cookies['crunchycast_visitor_id'] || 'default';
    const cookieWatchlist = visitorId ? cookies[`cc_wl_${visitorId}`] : '';

    const showsParam = req.query?.shows || cookieWatchlist || '';
    const offsetHours = Number(req.query?.offset ?? 1);
    const offsetSeconds = (Number.isNaN(offsetHours) ? 1 : offsetHours) * 3600;

    const showIds = String(showsParam)
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0)
      .slice(0, 50);

    const query =
      showIds.length > 0
        ? `
      query ($ids: [Int]) {
        Page(page: 1, perPage: 50) {
          media(id_in: $ids, type: ANIME) {
            id
            title { english romaji }
            episodes
            duration
            nextAiringEpisode { episode airingAt }
            airingSchedule(perPage: 25) { nodes { episode airingAt } }
            externalLinks { site url }
          }
        }
      }
    `
        : `
      query {
        Page(page: 1, perPage: 35) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
            id
            title { english romaji }
            episodes
            duration
            nextAiringEpisode { episode airingAt }
            airingSchedule(perPage: 25) { nodes { episode airingAt } }
            externalLinks { site url }
          }
        }
      }
    `;

    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query,
        variables: showIds.length > 0 ? { ids: showIds } : {},
      }),
    });

    const json = await response.json();
    const mediaList = json?.data?.Page?.media || [];
    const nowStamp = formatIcsDate(new Date());
    const events = [];

    for (const media of mediaList) {
      const title = media.title?.english || media.title?.romaji || 'Anime Simulcast';
      const crLink = (media.externalLinks || []).find((l) =>
        l.site.toLowerCase().includes('crunchyroll')
      );
      const watchUrl =
        crLink?.url ||
        `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`;
      const durationMins = media.duration || 24;

      const confirmedMap = new Map();
      for (const node of media.airingSchedule?.nodes || []) {
        if (node?.episode && node?.airingAt) {
          confirmedMap.set(node.episode, node.airingAt);
        }
      }
      if (media.nextAiringEpisode?.episode && media.nextAiringEpisode?.airingAt) {
        confirmedMap.set(
          media.nextAiringEpisode.episode,
          media.nextAiringEpisode.airingAt
        );
      }

      const confirmedEntries = Array.from(confirmedMap.entries()).sort(
        (a, b) => a[0] - b[0]
      );

      const slots = [];
      for (const [ep, rawAt] of confirmedEntries) {
        slots.push({ ep, rawAt, confirmed: true });
      }

      if (confirmedEntries.length > 0) {
        const [lastEp, lastRaw] = confirmedEntries[confirmedEntries.length - 1];
        const maxEps =
          lastEp > 24
            ? lastEp + 25
            : media.episodes != null
            ? media.episodes
            : Math.max(12, lastEp);
        let nextEp = lastEp + 1;
        let nextRaw = lastRaw + WEEK_SECONDS;
        while (nextEp <= maxEps && nextRaw <= MAX_PROJECTION_UNIX) {
          slots.push({ ep: nextEp, rawAt: nextRaw, confirmed: false });
          nextEp++;
          nextRaw += WEEK_SECONDS;
        }
      }

      for (const slot of slots) {
        const start = new Date((slot.rawAt + offsetSeconds) * 1000);
        const end = new Date(start.getTime() + durationMins * 60 * 1000);
        const statusLabel = slot.confirmed ? 'Confirmed' : 'Projected';
        events.push(
          [
            'BEGIN:VEVENT',
            `UID:crunchycast-${visitorId}-${media.id}-ep-${slot.ep}@crunchycast.vercel.app`,
            `DTSTAMP:${nowStamp}`,
            `DTSTART:${formatIcsDate(start)}`,
            `DTEND:${formatIcsDate(end)}`,
            `SUMMARY:${escapeIcsText(`${title} — Ep ${slot.ep} (${statusLabel})`)}`,
            `DESCRIPTION:${escapeIcsText(`Watch on Crunchyroll: ${watchUrl}`)}`,
            `URL:${watchUrl}`,
            'END:VEVENT',
          ].join('\r\n')
        );
      }
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CrunchyCast//Live Webcal Simulcast Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:CrunchyCast Simulcast Schedule',
      'X-PUBLISHED-TTL:PT1H',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-cache');
    res.status(200).send(ics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate live calendar feed' });
  }
}
