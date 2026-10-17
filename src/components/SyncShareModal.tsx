import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  UserCheck,
  Calendar,
  Download,
  Upload,
  Loader2,
  Fingerprint,
  UserPlus,
  Users,
} from 'lucide-react';
import { fetchAniListUserWatchlist } from '../services/anilistApi';
import { VisitorProfileMeta } from '../utils/visitorCookie';

interface SyncShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  visitorProfiles: VisitorProfileMeta[];
  onSwitchVisitorCookie: (targetVisitorId?: string, label?: string) => void;
  onRenameVisitorProfile: (visitorId: string, newLabel: string) => void;
  watchlist: Set<number>;
  watchedEpisodes: Record<number, number[]>;
  customOffsets: Record<number, number>;
  onImportWatchlistIds: (ids: number[], merge: boolean) => void;
  onRestoreBackup: (data: {
    watchlist?: number[];
    watchedEpisodes?: Record<number, number[]>;
    customOffsets?: Record<number, number>;
  }) => void;
}

export const SyncShareModal: React.FC<SyncShareModalProps> = ({
  isOpen,
  onClose,
  visitorId,
  visitorProfiles,
  onSwitchVisitorCookie,
  onRenameVisitorProfile,
  watchlist,
  watchedEpisodes,
  customOffsets,
  onImportWatchlistIds,
  onRestoreBackup,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedWebcal, setCopiedWebcal] = useState(false);
  const [copiedCookieId, setCopiedCookieId] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [anilistUser, setAnilistUser] = useState('');
  const [importingUser, setImportingUser] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  if (!isOpen) return null;

  const activeProfile = visitorProfiles.find((p) => p.id === visitorId);
  const watchlistArr = Array.from(watchlist);
  const totalWatchedCount = Object.values(watchedEpisodes).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://cr-watcher.vercel.app';
  const shareUrl =
    watchlistArr.length > 0 ? `${origin}/?wl=${watchlistArr.join(',')}` : origin;

  const webcalHost = origin.replace(/^https?:\/\//, '');
  const webcalUrl =
    watchlistArr.length > 0
      ? `webcal://${webcalHost}/api/calendar?vid=${visitorId}&shows=${watchlistArr.join(',')}`
      : `webcal://${webcalHost}/api/calendar?vid=${visitorId}`;

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyWebcal = () => {
    navigator.clipboard.writeText(webcalUrl);
    setCopiedWebcal(true);
    setTimeout(() => setCopiedWebcal(false), 2500);
  };

  const handleCopyCookieId = () => {
    navigator.clipboard.writeText(visitorId);
    setCopiedCookieId(true);
    setTimeout(() => setCopiedCookieId(false), 2500);
  };

  const handleCreateNewVisitorCookie = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newProfileName.trim() || `Visitor ${visitorProfiles.length + 1}`;
    onSwitchVisitorCookie(undefined, label);
    setNewProfileName('');
    setImportStatus({
      type: 'success',
      message: `Switched to new isolated visitor cookie profile "${label}". Watch tracking is now separated for this visitor.`,
    });
  };

  const handleImportAniListUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportingUser(true);
    setImportStatus(null);
    try {
      const ids = await fetchAniListUserWatchlist(anilistUser);
      if (ids.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'No Watching or Planning anime found on that public AniList profile.',
        });
      } else {
        onImportWatchlistIds(ids, true);
        setImportStatus({
          type: 'success',
          message: `Imported ${ids.length} anime from @${anilistUser} into this visitor's Watchlist!`,
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err?.message || 'Failed to import AniList user list.',
      });
    } finally {
      setImportingUser(false);
    }
  };

  const handleDownloadBackup = () => {
    const payload = {
      version: 2,
      visitorId,
      exportedAt: new Date().toISOString(),
      watchlist: watchlistArr,
      watchedEpisodes,
      customOffsets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crunchycast-${visitorId}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onRestoreBackup(parsed);
      setImportStatus({
        type: 'success',
        message:
          'Successfully restored Watchlist, Watched Progress, and Custom Offsets into your visitor cookie!',
      });
      setJsonInput('');
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Invalid JSON backup format.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#141519] border-t sm:border border-[#2A2E3B] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl sm:my-auto max-h-[92dvh] flex flex-col pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1B1D24] border-b border-[#2A2E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F47521]/20 text-[#F47521]">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Visitor Cookie Profile, Sync &amp; Webcal
              </h2>
              <p className="text-xs text-zinc-400">
                Each visitor&apos;s watched episodes and watchlist are isolated by their browser
                cookie
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

        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto">
          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border ${
                importStatus.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}
            >
              {importStatus.message}
            </div>
          )}

          {/* Section 0: Visitor Cookie Session & Multi-Person Isolation */}
          <div className="bg-[#0B0C10] border border-[#F47521]/40 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#F47521]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Active Visitor Cookie Session
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Cookie Isolated • {watchlistArr.length} Shows • {totalWatchedCount} Eps Watched
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your episode watch tracking (`cc_watched_{visitorId}`) and watchlist are stored in
              your personal browser cookie (`crunchycast_visitor_id`) so every visitor on this site
              sees only their own progress.
            </p>

            {/* Active Cookie ID + Rename */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-[#141519] border border-[#2A2E3B] rounded-xl px-3 py-1.5 flex-1 min-w-[200px]">
                <span className="text-[11px] text-zinc-400">Cookie ID:</span>
                <code className="text-xs font-mono font-bold text-[#F47521] truncate">
                  {visitorId}
                </code>
                <button
                  onClick={handleCopyCookieId}
                  className="ml-auto text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  title="Copy Visitor Cookie ID"
                >
                  {copiedCookieId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {activeProfile && (
                <input
                  type="text"
                  value={activeProfile.label}
                  onChange={(e) => onRenameVisitorProfile(visitorId, e.target.value)}
                  placeholder="Profile Name"
                  className="px-3 py-1.5 rounded-xl bg-[#141519] border border-[#2A2E3B] text-xs font-bold text-white w-36 focus:outline-none focus:border-[#F47521]"
                  title="Name this visitor cookie profile"
                />
              )}
            </div>

            {/* Switch or Create Additional Visitor Cookie Profile (for shared devices) */}
            <div className="pt-2 border-t border-[#2A2E3B]/70 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
                <Users className="w-3.5 h-3.5 text-[#F47521]" />
                <span>Sharing this device? Switch or create a separate Visitor Cookie Profile:</span>
              </div>

              {visitorProfiles.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {visitorProfiles.map((prof) => {
                    const isCurrent = prof.id === visitorId;
                    return (
                      <button
                        key={prof.id}
                        onClick={() => onSwitchVisitorCookie(prof.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                          isCurrent
                            ? 'bg-[#F47521] text-black border-[#F47521]'
                            : 'bg-[#141519] text-zinc-300 border-[#2A2E3B] hover:border-zinc-500'
                        }`}
                      >
                        {prof.label} ({prof.id.slice(0, 8)})
                      </button>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleCreateNewVisitorCookie} className="flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="New visitor name (e.g. Roommate / Player 2)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#141519] border border-[#2A2E3B] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F47521]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-xs font-bold text-[#F47521] shrink-0 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Visitor Cookie</span>
                </button>
              </form>
            </div>
          </div>

          {/* 1. Shareable Multi-Device URL */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#F47521] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>1. Shareable Watchlist Link</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Send this link to load your <strong className="text-white">{watchlistArr.length}</strong>{' '}
              bookmarked Watchlist shows on another device:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs text-zinc-200 font-mono"
              />
              <button
                onClick={handleCopyShareUrl}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F47521] hover:bg-[#FF8533] text-black font-extrabold text-xs shrink-0 transition-all"
              >
                {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* 2. Live Webcal Subscription (Vercel Serverless Function) */}
          <div className="space-y-2 pt-4 border-t border-[#2A2E3B]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2ABDBB] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Live Auto-Updating Webcal Feed (Scoped to Your Visitor Cookie)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Subscribe once in Google Calendar, Apple Calendar, or Outlook:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webcalUrl}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs text-zinc-200 font-mono"
              />
              <button
                onClick={handleCopyWebcal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2ABDBB] hover:bg-[#2ABDBB]/90 text-black font-extrabold text-xs shrink-0 transition-all"
              >
                {copiedWebcal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebcal ? 'Copied!' : 'Copy Webcal'}</span>
              </button>
            </div>
          </div>

          {/* 3. Import from AniList Username */}
          <form
            onSubmit={handleImportAniListUser}
            className="space-y-2 pt-4 border-t border-[#2A2E3B]"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>3. One-Click AniList Profile Sync</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Enter your public AniList username to import all of your <em>Watching</em> and{' '}
              <em>Planning</em> anime into this visitor cookie profile:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={anilistUser}
                onChange={(e) => setAnilistUser(e.target.value)}
                placeholder="Enter AniList username..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={importingUser || !anilistUser.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-black font-extrabold text-xs shrink-0 transition-all"
              >
                {importingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Import Profile</span>
              </button>
            </div>
          </form>

          {/* 4. Full JSON Backup & Restore */}
          <div className="space-y-2.5 pt-4 border-t border-[#2A2E3B]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                4. Full JSON Backup &amp; Restore
              </h3>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B1D24] hover:bg-[#232630] border border-[#2A2E3B] text-xs font-bold text-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#F47521]" />
                <span>Download Backup .JSON</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste backup JSON here to restore..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#2A2E3B] text-xs text-white placeholder-zinc-500 font-mono"
              />
              <button
                onClick={handleRestoreJson}
                disabled={!jsonInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B1D24] hover:bg-[#232630] disabled:opacity-50 border border-[#2A2E3B] text-xs font-bold text-zinc-200 shrink-0 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
