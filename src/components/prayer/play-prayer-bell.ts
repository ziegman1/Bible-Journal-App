/** Soft two-tone bell when a Prayer Wheel segment ends (best-effort; may fail if autoplay is blocked). */
export function playPrayerWheelBell(): void {
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const ding = (freq: number, start: number, dur: number, vol: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      o.type = "sine";
      const t0 = ctx.currentTime + start;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    };

    ding(880, 0, 0.45, 0.11);
    ding(660, 0.32, 0.4, 0.08);
  } catch {
    /* ignore */
  }
}
