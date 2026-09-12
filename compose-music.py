"""Compose the original LIGHT MAZE v7 soundtrack without sampled material.

The score is rendered offline so playback never competes with the 3D renderer.
Every cue is written as an exact circular loop and encoded as a compact MP3.
"""
from pathlib import Path
import subprocess
import numpy as np
from scipy.io import wavfile

SR = 32_000
OUT = Path("public/audio")
OUT.mkdir(parents=True, exist_ok=True)

TRACKS = [
    # file, title, bpm, root, scale, energy, bars, seed
    ("home", "帰還の灯", 72, 50, [0, 2, 3, 7, 9, 10], .28, 12, 7101),
    ("forge", "星鋳の儀式", 80, 45, [0, 1, 5, 7, 8, 10], .42, 12, 7102),
    ("stage-1", "最初の燐光", 64, 50, [0, 2, 3, 5, 7, 9, 10], .24, 12, 7201),
    ("stage-2", "影の足音", 68, 48, [0, 2, 3, 5, 7, 8, 10], .34, 12, 7202),
    ("stage-3", "疾走する回廊", 78, 46, [0, 2, 3, 5, 7, 9, 10], .45, 12, 7203),
    ("stage-4", "紫晶鉱脈", 84, 49, [0, 1, 3, 5, 7, 8, 10], .53, 12, 7204),
    ("stage-5", "転位の残響", 90, 47, [0, 1, 3, 6, 7, 10], .60, 12, 7205),
    ("stage-6", "銀光を追え", 96, 50, [0, 2, 3, 5, 7, 8, 11], .67, 12, 7206),
    ("stage-7", "深淵の門", 102, 45, [0, 1, 3, 5, 6, 8, 10], .76, 12, 7207),
    ("stage-8", "終わらない試練", 110, 43, [0, 1, 3, 6, 7, 8, 10], .86, 12, 7208),
    ("boss", "番人、覚醒", 124, 41, [0, 1, 3, 6, 7, 9, 10], 1.00, 12, 7301),
    ("escape", "灯が尽きる前に", 132, 50, [0, 2, 3, 5, 7, 8, 10], .93, 12, 7302),
]


def midi_hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def envelope(t, length, attack=.02, release=.18):
    return np.minimum(1, t / max(.001, attack)) * np.minimum(1, np.maximum(0, length - t) / max(.001, release))


def synth(note, length, voice, rng):
    t = np.arange(round(length * SR)) / SR
    f = midi_hz(note)
    phase = rng.uniform(0, np.pi * 2)
    if voice == "pad":
        wave = sum(np.sin(2*np.pi*f*h*t + phase/h) / h**1.75 for h in range(1, 5))
        wave += .24*np.sin(2*np.pi*f*1.004*t + phase*.7)
        return wave * envelope(t, length, .72, 1.25) * (.93 + .07*np.sin(2*np.pi*.11*t))
    if voice == "bell":
        partials = [(1, 1, 1.75), (2.01, .36, .72), (3.03, .13, .42), (4.18, .05, .22)]
        wave = sum(a*np.sin(2*np.pi*f*h*t+phase)*np.exp(-t/d) for h,a,d in partials)
        return wave * envelope(t, length, .006, .09)
    if voice == "pluck":
        wave = np.sin(2*np.pi*f*t+phase)+.28*np.sin(2*np.pi*f*2.003*t+phase*.3)
        return wave * np.exp(-t/1.05) * envelope(t, length, .004, .08)
    if voice == "horn":
        wave = np.tanh(1.5*(np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2*t)))
        return wave * envelope(t, length, .08, .35)
    wave = np.sin(2*np.pi*f*t+phase)+.18*np.sin(2*np.pi*f*.5*t)
    return wave * envelope(t, length, .06, .3)


def percussion(kind, length, rng):
    t = np.arange(round(length * SR)) / SR
    if kind == "kick":
        phase = 2*np.pi*(72*t + 65*(1-np.exp(-t*28))/28)
        return np.sin(phase)*np.exp(-t*17)
    if kind == "boom":
        phase = 2*np.pi*(43*t + 38*(1-np.exp(-t*11))/11)
        return (np.sin(phase)+.25*np.sin(phase*2))*np.exp(-t*5.5)
    noise = rng.normal(0, 1, len(t))
    smooth = np.convolve(noise, np.ones(5)/5, mode="same")
    return (noise-smooth)*np.exp(-t*(28 if kind == "tick" else 11))


def compose(spec):
    filename, title, bpm, root, scale, energy, bars, seed = spec
    beat = 60 / bpm
    length = bars * 4 * beat
    count = round(length * SR)
    mix = np.zeros((count, 2), np.float64)
    rng = np.random.default_rng(seed)

    def add(signal, start, pan=0, gain=1):
        indices = (np.arange(len(signal)) + round(start * SR)) % count
        mix[indices, 0] += signal * gain * np.sqrt((1-pan)/2)
        mix[indices, 1] += signal * gain * np.sqrt((1+pan)/2)

    progressions = [[0, 5, 3, 6], [0, 3, 5, 1], [0, 6, 1, 5]]
    progression = progressions[seed % len(progressions)]
    motif = [4, 2, 5, None, 3, 1, 6, 4]
    if filename in {"forge", "stage-4", "stage-5"}:
        motif = [0, 3, 6, 5, 1, None, 4, 2]
    if filename in {"boss", "escape", "stage-8"}:
        motif = [0, 0, 3, 1, 6, 5, 3, 1]

    for bar in range(bars):
        start = bar * 4 * beat
        degree = progression[bar % 4]
        base = root + scale[degree % len(scale)]
        chord = [base, base + scale[2], base + scale[4], base + 12 + scale[1]]
        for index, note in enumerate(chord):
            add(synth(note, 5.2*beat, "pad", rng), start, [-.62, -.2, .2, .62][index], .019 + energy*.014)
        add(synth(base-12, 3.8*beat, "bass", rng), start, 0, .052 + energy*.047)

        melody_steps = 4 if energy < .45 else 8
        for step in range(melody_steps):
            beat_pos = step * (4 / melody_steps)
            degree_pick = motif[(bar*melody_steps+step) % len(motif)]
            if degree_pick is None or (bar+step+seed) % 7 == 0:
                continue
            note = root + 12 + scale[degree_pick % len(scale)] + (12 if energy > .8 and step in {3, 7} else 0)
            voice = "bell" if energy < .65 else "pluck"
            add(synth(note, 2.2*beat, voice, rng), start+beat_pos*beat+.02, -.48 if step%2 else .48, .023 + energy*.031)

        # A restrained heartbeat becomes a driving rhythm deeper in the maze.
        if energy >= .34:
            for step in range(4):
                if step % 2 == 0 or energy > .7:
                    add(percussion("kick", .34, rng), start+step*beat, -.08, .025 + energy*.045)
            if energy >= .52:
                for step in range(8):
                    if step % 2:
                        add(percussion("tick", .12, rng), start+step*.5*beat, .58 if step%4==1 else -.58, .006 + energy*.014)
        if energy >= .75 and bar % 2 == 0:
            add(percussion("boom", .9, rng), start, 0, .045 + energy*.045)
        if energy >= .83 and bar in {3, 7, 11}:
            add(synth(root+12, 3.5*beat, "horn", rng), start, 0, .035 + energy*.035)

    dry = mix.copy()
    for delay, gain in [(.157, .17), (.311, .13), (.493, .10), (.811, .075), (1.277, .045)]:
        mix += np.roll(dry[:, ::-1], round(delay*SR), axis=0) * gain
    air = rng.normal(0, 1, count)
    air = np.convolve(air, np.ones(80)/80, mode="same") * (.0009 + energy*.00055)
    mix[:, 0] += air
    mix[:, 1] += np.roll(air, 173)
    mix = np.tanh(mix * (1.28 + energy*.18))
    mix *= .76 / max(.001, np.max(np.abs(mix)))

    wav = OUT / f"{filename}-source.wav"
    mp3 = OUT / f"{filename}.mp3"
    wavfile.write(wav, SR, (mix*32767).astype(np.int16))
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
        "-codec:a", "libmp3lame", "-b:a", "112k", "-write_xing", "0",
        "-metadata", f"title={title}", "-metadata", "artist=LIGHT MAZE Original Score", str(mp3)
    ], check=True)
    wav.unlink()
    print(f"{filename:8s} {title:12s} {length:5.1f}s / {bpm} BPM")


for track in TRACKS:
    compose(track)
