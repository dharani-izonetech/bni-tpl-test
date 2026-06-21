/**
 * Lightweight Web Audio engine for spinner & reveal sounds.
 * All functions are pure — callers manage the returned handles.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (_ctx) return _ctx;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  _ctx = new Ctor();
  return _ctx;
}

function resume() {
  const ctx = getCtx();
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

// ── Spinner tick sound ──────────────────────────────────────────────────────
export interface SpinHandle {
  stop: () => void;
}

export function startSpinSound(): SpinHandle {
  const ctx = resume();
  if (!ctx) return { stop: () => {} };

  // Rotor oscillator
  const rotorOsc = ctx.createOscillator();
  const rotorGain = ctx.createGain();
  rotorOsc.type = "triangle";
  rotorOsc.frequency.setValueAtTime(44, ctx.currentTime);
  rotorOsc.frequency.linearRampToValueAtTime(62, ctx.currentTime + 1.2);
  rotorGain.gain.setValueAtTime(0.001, ctx.currentTime);
  rotorGain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.06);
  rotorOsc.connect(rotorGain);
  rotorGain.connect(ctx.destination);
  rotorOsc.start();

  // Motor oscillator
  const motorOsc = ctx.createOscillator();
  const motorGain = ctx.createGain();
  motorOsc.type = "triangle";
  motorOsc.frequency.setValueAtTime(66, ctx.currentTime);
  motorOsc.frequency.linearRampToValueAtTime(86, ctx.currentTime + 1.2);
  motorGain.gain.setValueAtTime(0.001, ctx.currentTime);
  motorGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.08);
  motorOsc.connect(motorGain);
  motorGain.connect(ctx.destination);
  motorOsc.start();

  // Ratchet clicks
  const playClick = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1900 + Math.random() * 240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.014);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.26, ctx.currentTime + 0.0012);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.016);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.018);
  };

  playClick();
  const clickTimer = window.setInterval(playClick, 68);

  return {
    stop() {
      window.clearInterval(clickTimer);
      const now = ctx.currentTime;
      rotorGain.gain.cancelScheduledValues(now);
      rotorGain.gain.setValueAtTime(rotorGain.gain.value, now);
      rotorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      motorGain.gain.cancelScheduledValues(now);
      motorGain.gain.setValueAtTime(motorGain.gain.value, now);
      motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      rotorOsc.stop(now + 0.14);
      motorOsc.stop(now + 0.14);

      // Stop thunk
      const thunkOsc = ctx.createOscillator();
      const thunkGain = ctx.createGain();
      thunkOsc.type = "square";
      thunkOsc.frequency.setValueAtTime(148, now);
      thunkOsc.frequency.exponentialRampToValueAtTime(44, now + 0.14);
      thunkGain.gain.setValueAtTime(0.001, now);
      thunkGain.gain.exponentialRampToValueAtTime(0.2, now + 0.0025);
      thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      thunkOsc.connect(thunkGain);
      thunkGain.connect(ctx.destination);
      thunkOsc.start();
      thunkOsc.stop(now + 0.19);
    },
  };
}

// ── Match reveal sound ──────────────────────────────────────────────────────
export interface RevealHandle {
  stop: () => void;
}

export function startRevealSound(): RevealHandle {
  const ctx = resume();
  if (!ctx) return { stop: () => {} };

  const droneOsc = ctx.createOscillator();
  const droneGain = ctx.createGain();
  droneOsc.type = "sawtooth";
  droneOsc.frequency.setValueAtTime(120, ctx.currentTime);
  droneOsc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.4);
  droneGain.gain.setValueAtTime(0.001, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.1);
  droneOsc.connect(droneGain);
  droneGain.connect(ctx.destination);
  droneOsc.start();

  const playTick = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(700 + Math.random() * 260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  };

  const tickTimer = window.setInterval(playTick, 150);
  playTick();

  return {
    stop() {
      window.clearInterval(tickTimer);
      const now = ctx.currentTime;
      droneGain.gain.cancelScheduledValues(now);
      droneGain.gain.setValueAtTime(droneGain.gain.value, now);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      droneOsc.stop(now + 0.14);
    },
  };
}

// ── Match reveal hit ────────────────────────────────────────────────────────
export function playRevealHit() {
  const ctx = resume();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(360, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.14);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

// ── Button click sound ──────────────────────────────────────────────────────
export function playButtonClick() {
  const ctx = resume();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}
