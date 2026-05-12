// 데모 음악 생성 — Web Audio API로 무드별 짧은 멜로디 합성
// API 키 미설정 시 fallback. 외부 의존 없음, 항상 작동.
// 결과: Blob (audio/wav) → 오디오 플레이어에 바로 사용 가능

import { type MusicMood, getPreset } from "./music-presets";

// 펜타토닉/메이저 음계 — 무드별 다른 키
type Scale = number[]; // 반음 단위 오프셋

const SCALES: Record<MusicMood, { rootHz: number; scale: Scale; pattern: number[] }> = {
  // C major pentatonic
  "warm-acoustic": { rootHz: 261.63, scale: [0, 2, 4, 7, 9], pattern: [0, 2, 4, 2, 1, 0, 2, 4] },
  // A minor pentatonic, low
  "lofi-chill":    { rootHz: 220.00, scale: [0, 3, 5, 7, 10], pattern: [0, 2, 4, 3, 1, 0, 2, 1] },
  // D major
  "indie-bright":  { rootHz: 293.66, scale: [0, 2, 4, 5, 7, 9, 11], pattern: [0, 2, 4, 5, 4, 2, 0, 4] },
  // F minor — slow, emotional
  "ballad-emo":    { rootHz: 174.61, scale: [0, 3, 5, 7, 8, 10], pattern: [0, 3, 5, 7, 5, 3, 2, 0] },
  // G major, groovy
  "city-pop":      { rootHz: 196.00, scale: [0, 2, 4, 5, 7, 9, 11], pattern: [0, 4, 2, 5, 4, 7, 5, 2] },
  // E major, energetic
  "kpop-energy":   { rootHz: 329.63, scale: [0, 2, 4, 5, 7, 9, 11], pattern: [0, 4, 7, 4, 5, 4, 2, 0] },
  // E minor pentatonic — rock
  "rock-edge":     { rootHz: 164.81, scale: [0, 3, 5, 7, 10], pattern: [0, 3, 4, 3, 0, 2, 4, 3] },
  // C major slow ambient
  "ambient-spa":   { rootHz: 261.63, scale: [0, 4, 7, 11], pattern: [0, 1, 2, 3, 2, 1, 0, 1] },
};

const semitoneToRatio = (semi: number) => Math.pow(2, semi / 12);

/**
 * 무드 + 길이에 맞는 멜로디 + 코드 패드 + 비트를 OfflineAudioContext 로 합성.
 * 결과를 WAV Blob 으로 반환.
 */
export async function synthesizeDemoMusic(opts: {
  mood: MusicMood;
  durationSec: number;
  bpm: number;
}): Promise<{ blob: Blob; durationSec: number }> {
  const { mood, durationSec, bpm } = opts;
  const cfg = SCALES[mood] ?? SCALES["warm-acoustic"];
  const preset = getPreset(mood);
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);

  // 일부 환경에서 OfflineAudioContext prefix
  const OAC =
    (typeof window !== "undefined" &&
      ((window as any).OfflineAudioContext ?? (window as any).webkitOfflineAudioContext)) ||
    null;
  if (!OAC) throw new Error("Web Audio (OfflineAudioContext) 미지원 브라우저");

  const ctx: OfflineAudioContext = new OAC(2, totalSamples, sampleRate);

  const beatSec = 60 / bpm;
  const noteSec = beatSec / 2; // 8분음표 그리드

  // 마스터 게인 + 라이트 컴프레션 효과 (게인 자동 감쇄)
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  // ─── 1) 멜로디 — 사인파 + 트라이앵글 살짝 섞기 ───
  const melodyGain = ctx.createGain();
  melodyGain.gain.value = 0.42;
  melodyGain.connect(master);

  for (let i = 0, t = 0; t < durationSec; i++, t += noteSec) {
    const step = cfg.pattern[i % cfg.pattern.length];
    if (step === -1) continue; // 쉼표 가능
    const hz = cfg.rootHz * semitoneToRatio(cfg.scale[step % cfg.scale.length] + (Math.floor(step / cfg.scale.length) * 12));
    playTone(ctx, melodyGain, t, noteSec * 0.95, hz, "triangle", 0.55);
  }

  // ─── 2) 코드 패드 — 루트+5도 지속음 4박마다 변경 ───
  const padGain = ctx.createGain();
  padGain.gain.value = 0.22;
  padGain.connect(master);

  const padChords: number[][] = [
    [0, 7, 12],      // I
    [5, 0, 12],      // IV → vi 분위기
    [7, 2, 14],      // V
    [0, 7, 12],      // I
  ];
  const padLenSec = beatSec * 4;
  for (let t = 0, idx = 0; t < durationSec; t += padLenSec, idx++) {
    const chord = padChords[idx % padChords.length];
    for (const semi of chord) {
      const hz = cfg.rootHz * semitoneToRatio(semi) * 0.5; // 한 옥타브 아래
      playTone(ctx, padGain, t, Math.min(padLenSec, durationSec - t), hz, "sine", 0.85, true);
    }
  }

  // ─── 3) 비트 — 무드별 차등 ───
  const beatLevel = beatLevels(mood);
  if (beatLevel > 0) {
    const beatGain = ctx.createGain();
    beatGain.gain.value = beatLevel;
    beatGain.connect(master);
    for (let t = 0; t < durationSec; t += beatSec) {
      addKick(ctx, beatGain, t);
      if (preset.tempo !== "slow") {
        // 오프비트 하이햇 (스파클)
        addHiHat(ctx, beatGain, t + beatSec * 0.5);
      }
    }
  }

  // ─── 4) 페이드 인/아웃 ───
  const fade = Math.min(0.6, durationSec * 0.1);
  master.gain.setValueAtTime(0.001, 0);
  master.gain.exponentialRampToValueAtTime(0.55, fade);
  master.gain.setValueAtTime(0.55, durationSec - fade);
  master.gain.exponentialRampToValueAtTime(0.001, durationSec);

  const buffer = await ctx.startRendering();
  const wav = audioBufferToWav(buffer);
  return {
    blob: new Blob([wav], { type: "audio/wav" }),
    durationSec,
  };
}

function beatLevels(mood: MusicMood): number {
  switch (mood) {
    case "ambient-spa":
    case "ballad-emo":
      return 0; // 비트 없음
    case "warm-acoustic":
      return 0.18;
    case "lofi-chill":
      return 0.28;
    case "indie-bright":
      return 0.3;
    case "city-pop":
      return 0.35;
    case "kpop-energy":
    case "rock-edge":
      return 0.42;
  }
}

function playTone(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  startSec: number,
  durSec: number,
  hz: number,
  type: OscillatorType,
  attack = 0.6,
  longSustain = false,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = hz;
  osc.connect(g);
  g.connect(dest);
  const a = Math.min(durSec * 0.1, 0.03);
  const r = Math.min(durSec * (longSustain ? 0.5 : 0.4), longSustain ? 1.5 : 0.3);
  g.gain.setValueAtTime(0.0001, startSec);
  g.gain.exponentialRampToValueAtTime(attack, startSec + a);
  g.gain.setValueAtTime(attack, startSec + durSec - r);
  g.gain.exponentialRampToValueAtTime(0.0001, startSec + durSec);
  osc.start(startSec);
  osc.stop(startSec + durSec + 0.01);
}

function addKick(ctx: OfflineAudioContext, dest: AudioNode, startSec: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, startSec);
  osc.frequency.exponentialRampToValueAtTime(45, startSec + 0.12);
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.9, startSec);
  g.gain.exponentialRampToValueAtTime(0.001, startSec + 0.18);
  osc.start(startSec);
  osc.stop(startSec + 0.2);
}

function addHiHat(ctx: OfflineAudioContext, dest: AudioNode, startSec: number) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, startSec);
  g.gain.exponentialRampToValueAtTime(0.001, startSec + 0.05);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(startSec);
}

// ─── AudioBuffer → 16-bit PCM WAV (Uint8Array) ───
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length * numCh * 2 + 44;
  const out = new ArrayBuffer(len);
  const view = new DataView(out);
  let offset = 0;

  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };
  const writeU32 = (v: number) => {
    view.setUint32(offset, v, true);
    offset += 4;
  };
  const writeU16 = (v: number) => {
    view.setUint16(offset, v, true);
    offset += 2;
  };

  writeStr("RIFF");
  writeU32(len - 8);
  writeStr("WAVE");
  writeStr("fmt ");
  writeU32(16);
  writeU16(1); // PCM
  writeU16(numCh);
  writeU32(sr);
  writeU32(sr * numCh * 2); // byte rate
  writeU16(numCh * 2);      // block align
  writeU16(16);             // bits per sample
  writeStr("data");
  writeU32(buffer.length * numCh * 2);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i];
      s = Math.max(-1, Math.min(1, s));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return out;
}
