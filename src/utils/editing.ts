import type {Segment} from "../components/media/JumpCut";

/** Add padding to segments and filter out tiny ones */
export const buildCutList = (
  speechSegments: Segment[],
  options: {paddingSeconds?: number; minSegmentSeconds?: number} = {},
): Segment[] => {
  const {paddingSeconds = 0.1, minSegmentSeconds = 0.3} = options;

  return speechSegments
    .map((seg) => ({
      startSeconds: Math.max(0, seg.startSeconds - paddingSeconds),
      endSeconds: seg.endSeconds + paddingSeconds,
    }))
    .filter((seg) => seg.endSeconds - seg.startSeconds >= minSegmentSeconds);
};

/** Merge adjacent segments separated by small gaps */
export const mergeSegments = (
  segments: Segment[],
  gapThresholdSeconds: number = 0.3,
): Segment[] => {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.startSeconds - b.startSeconds);
  const merged: Segment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.startSeconds - last.endSeconds <= gapThresholdSeconds) {
      last.endSeconds = Math.max(last.endSeconds, current.endSeconds);
    } else {
      merged.push({...current});
    }
  }

  return merged;
};

/** Calculate total duration of segments in seconds */
export const calculateTotalDuration = (segments: Segment[]): number =>
  segments.reduce((sum, seg) => sum + (seg.endSeconds - seg.startSeconds), 0);

/** Offset captions for clip extraction */
export const offsetCaptions = <T extends {startMs: number; endMs: number}>(
  captions: T[],
  offsetMs: number,
): T[] =>
  captions
    .map((c) => ({
      ...c,
      startMs: c.startMs - offsetMs,
      endMs: c.endMs - offsetMs,
    }))
    .filter((c) => c.startMs >= 0 && c.endMs > 0);

/**
 * Move caption timestamps from the original video timeline onto a JumpCut timeline.
 * Uses the same per-segment frame rounding as <JumpCut paddingSeconds={0}>, so captions
 * stay in sync after silence removal. Captions that fall in a removed gap are dropped.
 */
export const remapCaptionsToCuts = <
  T extends {startMs: number; endMs: number; timestampMs?: number | null},
>(
  captions: T[],
  segments: Segment[],
  fps: number,
): T[] => {
  let offsetFrames = 0;
  const spans = segments.map((seg) => {
    const frames = Math.round((seg.endSeconds - seg.startSeconds) * fps);
    const span = {startMs: seg.startSeconds * 1000, endMs: seg.endSeconds * 1000, outMs: (offsetFrames / fps) * 1000};
    offsetFrames += frames;
    return span;
  });
  const result: T[] = [];
  for (const c of captions) {
    const span = spans.find((s) => c.startMs >= s.startMs && c.startMs < s.endMs);
    if (!span) continue;
    const shift = span.outMs - span.startMs;
    result.push({
      ...c,
      startMs: c.startMs + shift,
      endMs: Math.min(c.endMs, span.endMs) + shift,
      ...(c.timestampMs != null ? {timestampMs: c.timestampMs + shift} : {}),
    });
  }
  return result;
};
