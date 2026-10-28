// Original 140 BPM party-racing score. All sound is synthesized locally.
// No samples, downloads, or per-frame work; the scheduler looks ahead 130 ms.
const midi = note => 440 * 2 ** ((note - 69) / 12);
const ROOTS = [50,57,59,55,50,54,55,57,59,55,50,57,55,57,50,57];
const MELODIES = [
 [[0,0,1.4],[3,7,1],[6,9,1.5],[10,4,1],[13,2,1],[15,7,.7]],
 [[2,4,1.2],[5,2,1],[8,0,1.5],[11,-3,1],[14,2,1.2]],
 [[0,9,1.4],[3,7,1],[7,4,1.6],[10,2,1],[13,4,1.4]],
 [[1,7,1.2],[4,11,1],[7,9,1],[10,7,1],[12,4,.8],[14,2,.8]]
];
const PHASES = new Set(['ready','countdown','running','paused','finished']);

export class PartyMusic {
 constructor({context = null, volume = .38, bpm = 140} = {}) {
  this.context = context;
  this.volume = Math.max(0,Math.min(1,volume));
  this.bpm = Math.max(132,Math.min(145,bpm));
  this.muted = true;
  this.phase = 'ready';
  this._ownsContext = !context;
  this._unlocked = false;
  this._disposed = false;
  this._voices = new Set();
  this._tick = 0;
  this._timer = null;
  this._finishedPlayed = false;
  this._visibility = () => this._sync();
  globalThis.document?.addEventListener('visibilitychange',this._visibility);
 }

 // Call from a click/tap. Returns false when Web Audio is unavailable.
 async unlock() {
  if (this._disposed) return false;
  try {
   const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
   if (!this.context) {
    if (!Audio) return false;
    this.context = new Audio({latencyHint:'playback'});
   }
   if (this.context.state === 'closed') return false;
   this._prepare();
   await this.context.resume();
   this._unlocked = this.context.state === 'running';
   this._sync();
   return this._unlocked;
  } catch { return false; }
 }

 setMuted(value) {
  const next = !!value;
  if (next === this.muted) return;
  this.muted = next;
  this._sync();
 }

 setVolume(value) {
  if (!Number.isFinite(value)) return;
  this.volume = Math.max(0,Math.min(1,value));
  if (this._master && this._audible()) {
   this._master.gain.setTargetAtTime(this.volume,this.context.currentTime,.025);
  }
 }

 setPhase(phase) {
  if (!PHASES.has(phase) || phase === this.phase || this._disposed) return;
  const previous = this.phase;
  this.phase = phase;
  if (phase === 'ready' || phase === 'countdown') {
   this._tick = 0;
   this._finishedPlayed = false;
  } else if (phase === 'running' && previous !== 'paused') this._tick = 0;
  this._stop();
  this._sync();
 }

 _prepare() {
  if (this._master) return;
  const ctx = this.context;
  this._master = ctx.createGain();
  this._master.gain.value = 0;
  this._compressor = ctx.createDynamicsCompressor();
  this._compressor.threshold.value = -18;
  this._compressor.knee.value = 14;
  this._compressor.ratio.value = 3.5;
  this._compressor.attack.value = .004;
  this._compressor.release.value = .14;
  this._master.connect(this._compressor);
  this._compressor.connect(ctx.destination);
  // One deterministic noise buffer serves the entire percussion kit.
  this._noise = ctx.createBuffer(1,Math.ceil(ctx.sampleRate * .8),ctx.sampleRate);
  const samples = this._noise.getChannelData(0);
  let random = 0x51ab7e;
  for (let i = 0; i < samples.length; i++) {
   random = (Math.imul(random,1664525) + 1013904223) >>> 0;
   samples[i] = random / 2147483648 - 1;
  }
 }

 _audible() {
  return !this._disposed && this._unlocked && !this.muted &&
   !globalThis.document?.hidden && this.context?.state === 'running';
 }

 _sync() {
  if (!this._audible() || ['ready','paused'].includes(this.phase)) {
   this._stop();
   return;
  }
  if (this._timer || (this.phase === 'finished' && this._finishedPlayed)) return;
  const now = this.context.currentTime;
  this._master.gain.cancelScheduledValues(now);
  this._master.gain.setValueAtTime(0,now);
  this._master.gain.linearRampToValueAtTime(this.volume,now + .035);
  if (this.phase === 'finished') {
   this._finishedPlayed = true;
   this._victory(now + .045);
   return;
  }
  this._nextTime = now + .045;
  this._pump();
  this._timer = setInterval(() => this._pump(),40);
 }

 _pump() {
  if (!this._audible()) { this._stop(); return; }
  const now = this.context.currentTime;
  // A delayed/background timer never schedules a backlog of missed notes.
  if (this._nextTime < now - .2) this._nextTime = now + .025;
  let scheduled = 0;
  while (this._nextTime < now + .13 && scheduled++ < 8) {
   this._scheduleTick(this._tick++,this._nextTime);
   this._nextTime += 60 / this.bpm / 4;
  }
 }

 _scheduleTick(tick,time) {
  const step = tick % 16, bar = Math.floor(tick / 16) % 16;
  const sixteenth = 60 / this.bpm / 4;
  if (this.phase === 'countdown') {
   if (step % 4 === 0) this._tom(time,44 + (step === 12 ? 5 : 0),.1,.11);
   if (step % 2 === 0) this._noiseHit(time,.035,.024,6500);
   return;
  }
  // Four-on-the-floor anchors syncopated bass, claps and hand percussion.
  if (step % 4 === 0 || (bar % 4 === 3 && step === 14)) this._kick(time);
  if (step === 4 || step === 12) this._clap(time);
  if (step % 2 === 0 || (bar >= 8 && step === 15)) {
   this._noiseHit(time,.027,step % 4 === 2 ? .038 : .021,7200);
  }
  if ((step === 7 || step === 15) && bar % 2 === 1) this._tom(time,48 + (bar % 3) * 3,.11,.075);
  if (bar % 8 === 7 && step >= 12 && step % 2 === 0) this._tom(time,55 - (step - 12) * 2,.09,.09);

  const root = ROOTS[bar];
  if ([0,3,6,8,11,14].includes(step)) {
   const offset = step === 6 ? 7 : step === 11 ? 12 : 0;
   this._tone(root - 12 + offset,time,sixteenth * 1.5,.19,'triangle',650);
  }
  // Short offbeat triad stabs; bars with B/F# roots use minor thirds.
  if (step === 2 || step === 10) {
   const third = [59,54].includes(root) ? 3 : 4;
   [0,third,7].forEach(n => this._tone(root + 12 + n,time,sixteenth * .85,.033,'sawtooth',1450));
  }
  const motif = MELODIES[bar % MELODIES.length];
  const note = motif.find(item => item[0] === step);
  // Leave breathing room every fourth bar, then answer in a higher register.
  if (note && !(bar % 4 === 3 && step < 7)) {
   const octave = bar >= 12 && (step === 13 || step === 14) ? 12 : 0;
   this._tone(74 + note[1] + octave,time,sixteenth * note[2],.084,'sawtooth',2100);
  }
  if (bar % 8 === 7 && step === 15) this._tone(81,time,sixteenth * .7,.06,'triangle',2600);
 }

 _track(sources,nodes,end) {
  const voice = {sources,nodes};
  this._voices.add(voice);
  sources[0].onended = () => {
   this._voices.delete(voice);
   for (const node of nodes) { try { node.disconnect(); } catch {} }
  };
  for (const source of sources) source.stop(end);
 }

 _tone(note,time,length,level,wave = 'triangle',cutoff = 1600) {
  const ctx = this.context, osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  const end = time + length + .065;
  osc.type = wave;
  osc.frequency.setValueAtTime(midi(note),time);
  filter.type = 'lowpass';filter.Q.value = .7;
  filter.frequency.setValueAtTime(cutoff,time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(180,cutoff * .4),end);
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.linearRampToValueAtTime(level,time + .009);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level * .5),time + length * .7);
  gain.gain.exponentialRampToValueAtTime(.0001,end);
  osc.connect(filter);filter.connect(gain);gain.connect(this._master);
  osc.start(time);this._track([osc],[osc,filter,gain],end + .01);
 }

 _kick(time) {
  const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.frequency.setValueAtTime(155,time);
  osc.frequency.exponentialRampToValueAtTime(46,time + .12);
  gain.gain.setValueAtTime(.29,time);
  gain.gain.exponentialRampToValueAtTime(.0001,time + .17);
  osc.connect(gain);gain.connect(this._master);
  osc.start(time);this._track([osc],[osc,gain],time + .18);
 }

 _tom(time,note,length,level) {
  const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.frequency.setValueAtTime(midi(note + 5),time);
  osc.frequency.exponentialRampToValueAtTime(midi(note),time + length * .6);
  gain.gain.setValueAtTime(level,time);
  gain.gain.exponentialRampToValueAtTime(.0001,time + length);
  osc.connect(gain);gain.connect(this._master);
  osc.start(time);this._track([osc],[osc,gain],time + length + .01);
 }

 _noiseHit(time,length,level,frequency,clap = false) {
  const ctx = this.context, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  source.buffer = this._noise;
  filter.type = clap ? 'bandpass' : 'highpass';filter.frequency.value = frequency;filter.Q.value = clap ? .7 : .45;
  gain.gain.setValueAtTime(level,time);
  if (clap) {
   for (let pulse = 1; pulse <= 3; pulse++) {
    gain.gain.setValueAtTime(.0001,time + pulse * .018 - .004);
    gain.gain.setValueAtTime(level / (1 + pulse * .25),time + pulse * .018);
   }
  }
  gain.gain.exponentialRampToValueAtTime(.0001,time + length);
  source.connect(filter);filter.connect(gain);gain.connect(this._master);
  source.start(time,(this._tick % 5) * .11);
  this._track([source],[source,filter,gain],time + length + .01);
 }

 _clap(time) { this._noiseHit(time,.14,.13,1700,true); }

 _victory(time) {
  const beat = 60 / this.bpm;
  [[0,74],[.5,78],[1,81],[1.5,86],[2,81],[2.5,86]].forEach(([at,note],i) => {
   this._tone(note,time + at * beat,i === 5 ? beat * 1.6 : beat * .38,.1,'sawtooth',2400);
  });
  [50,57,62].forEach((note,i) => this._tone(note,time + i * beat,beat * .7,.14,'triangle',850));
  [0,1,2].forEach(at => {this._kick(time + at * beat);if (at) this._clap(time + at * beat);});
  [74,78,81].forEach(note => this._tone(note,time + beat * 3,beat * 1.5,.065,'triangle',2200));
 }

 _stop() {
  if (this._timer !== null) clearInterval(this._timer);
  this._timer = null;
  if (!this.context || !this._master || this.context.state === 'closed') return;
  const now = this.context.currentTime;
  this._master.gain.cancelScheduledValues(now);
  this._master.gain.setTargetAtTime(0,now,.008);
  for (const voice of this._voices) for (const source of voice.sources) {
   try { source.stop(now + .025); } catch {}
  }
 }

 dispose() {
  if (this._disposed) return;
  this._stop();
  this._disposed = true;
  globalThis.document?.removeEventListener('visibilitychange',this._visibility);
  this._master?.disconnect();
  this._compressor?.disconnect();
  this._noise = null;
  if (this._ownsContext && this.context?.state !== 'closed') this.context?.close().catch(() => {});
 }
}
