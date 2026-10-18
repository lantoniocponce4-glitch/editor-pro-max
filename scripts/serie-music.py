#!/usr/bin/env python3
"""
Música de la serie "Amor en Fit Life". Lee los cues de un episodio
(src/compositions/serie/epN.json) y compone por tramos:
  romance  piano + cuerdas en La menor (Am F C G)
  comic    pizzicato saltarín en Do mayor
  tension  zumbido grave + pulso
  fiesta   "Cumpleaños feliz" (dominio público) en caja musical
  end      acorde sostenido
más latidos, golpes graves con whoosh y "boing" cómicos en los cuadros indicados.
Uso: python3 scripts/serie-music.py 1   ->  public/serie/ep1-musica.wav (luego a mp3)
Requiere numpy.
"""
import json
import os
import sys
import wave

import numpy as np

EP = sys.argv[1]
T = json.load(open(f"src/compositions/serie/ep{EP}.json"))
FPS = T["fps"]
end_frame = max(s[0] + s[1] for s in T["scenes"].values())
DUR = end_frame / FPS
SR = 44100
N = int(SR * DUR)
music = np.zeros(N)
fx = np.zeros(N)
rng = np.random.default_rng(int(EP))


def add(track, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: N - i]
    track[i : i + len(sig)] += sig * gain


def hz(n):
    return 440.0 * 2 ** (n / 12)


def env_tone(freq, length, decay, harmonics=((1, 1),), attack=0.004):
    t = np.arange(int(SR * length)) / SR
    s = sum(g * np.sin(2 * np.pi * freq * m * t) * np.exp(-t * decay * m) for m, g in harmonics)
    return s * np.minimum(1, t / attack)


def piano(f, length=2.2):
    return env_tone(f, length, 2.2, ((1, 1), (2, 0.45), (3, 0.2)))


def pizz(f):
    return env_tone(f, 0.35, 12, ((1, 1), (2, 0.3)))


def bell(f):
    return env_tone(f, 0.9, 4.5, ((1, 1), (2, 0.35), (5.4, 0.15)), 0.003)


def strings(freqs, length, attack=0.6):
    t = np.arange(int(SR * length)) / SR
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, length - t) / 0.4)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.004, 0, 0.005):
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t))) / SR
            s += np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return env * s / (len(freqs) * 3)


def heartbeat():
    def thump(f0, length, g):
        t = np.arange(int(SR * length)) / SR
        return g * np.sin(2 * np.pi * (f0 * np.exp(-t * 6)) * t) * np.exp(-t * 18)
    out = np.zeros(int(SR * 0.5))
    a, b = thump(70, 0.25, 1.0), thump(60, 0.25, 0.7)
    out[: len(a)] += a
    j = int(SR * 0.18)
    out[j : j + len(b)] += b[: len(out) - j]
    return out


def boom():
    t = np.arange(int(SR * 2.0)) / SR
    return np.sin(2 * np.pi * (34 + 40 * np.exp(-t * 7)) * t) * np.exp(-t * 1.8) + rng.standard_normal(len(t)) * np.exp(-t * 25) * 0.5


def whoosh(length=0.55):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    out, acc = np.zeros(n), 0.0
    for i in range(n):
        acc += (0.02 + 0.5 * (i / n) ** 2) * (noise[i] - acc)
        out[i] = acc
    return out * (np.arange(n) / n) ** 2


def boing():
    t = np.arange(int(SR * 0.5)) / SR
    f = 180 + 260 * np.exp(-t * 5) * (1 + 0.25 * np.sin(2 * np.pi * 18 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)


def section(mood, t0, t1):
    length = t1 - t0
    if mood == "romance":
        beat = 60 / 72
        prog = [(-12, [0, 3, 7]), (-16, [-4, 0, 3]), (-9, [-9, -5, -2]), (-14, [-2, 2, 5])]
        mel = [12, 10, 7, 8, 7, 5, 3, 5]
        t, bar = t0, 0
        while t < t1 - 0.1:
            root, tri = prog[bar % 4]
            L = min(4 * beat, t1 - t)
            add(music, strings([hz(root - 12)] + [hz(x - 12) for x in tri], L + 0.3, 0.8), t, 0.5)
            for k, n in enumerate([tri[0], tri[1], tri[2], tri[1] + 12, tri[2], tri[1], tri[0] + 12, tri[2]]):
                if t + k * beat / 2 < t1 - 0.05:
                    add(music, piano(hz(n)), t + k * beat / 2, 0.15)
            add(music, piano(hz(mel[(bar * 2) % 8]), 3.0), t, 0.2)
            t += 4 * beat
            bar += 1
    elif mood == "comic":
        beat = 60 / 128
        bass = [-21, -14, -16, -14]  # C G A G
        mel = [3, 7, 10, 7, 12, 10, 7, 5, 3, 5, 7, 3, 2, 3, None, None]
        t, k = t0, 0
        while t < t1 - 0.05:
            if k % 2 == 0:
                add(music, pizz(hz(bass[(k // 8) % 4])), t, 0.5)
            n = mel[k % 16]
            if n is not None:
                add(music, pizz(hz(n + 12)), t, 0.3)
            if k % 4 == 2:
                add(music, rng.standard_normal(int(SR * 0.04)) * np.exp(-np.arange(int(SR * 0.04)) / (SR * 0.01)), t, 0.06)
            t += beat / 2
            k += 1
    elif mood == "tension":
        add(music, strings([hz(-36), hz(-29), hz(-24)], length + 0.3, attack=1.5), t0, 0.45)
        t = t0
        while t < t1:
            add(music, env_tone(hz(-36), 0.4, 6), t, 0.5)
            t += 0.9
    elif mood == "fiesta":
        G4, A4, B4, C5, D5, E5, F5, G5 = -2, 0, 2, 3, 5, 7, 8, 10
        tune = [(G4, .75), (G4, .25), (A4, 1), (G4, 1), (C5, 1), (B4, 2), (G4, .75), (G4, .25), (A4, 1), (G4, 1), (D5, 1), (C5, 2),
                (G4, .75), (G4, .25), (G5, 1), (E5, 1), (C5, 1), (B4, 1), (A4, 1), (F5, .75), (F5, .25), (E5, 1), (C5, 1), (D5, 1), (C5, 3)]
        beat = 60 / 100
        t = t0
        while t < t1 - 1:
            for n, b in tune:
                if t >= t1 - 0.2:
                    break
                add(music, bell(hz(n + 12)), t, 0.32)
                if b >= 1:
                    add(music, strings([hz(n - 12)], b * beat, 0.05), t, 0.15)
                t += b * beat
    elif mood == "end":
        add(music, strings([hz(-24), hz(-12), hz(-9), hz(-5)], length, 0.3), t0, 0.6)
        add(music, piano(hz(0), 3.5), t0 + 0.2, 0.3)
        add(music, piano(hz(-12), 3.5), t0 + 0.2, 0.3)


for cue in T["music"]:
    a, b = cue["from"] / FPS, cue["to"] / FPS
    tmp = music.copy()
    music[:] = 0
    section(cue["mood"], a, b)
    # fundido corto en los bordes del tramo
    seg = music.copy()
    ramp = int(SR * 0.25)
    i0, i1 = int(a * SR), min(N, int(b * SR) + int(SR * 0.6))
    w = np.zeros(N)
    w[i0:i1] = 1
    w = np.convolve(w, np.ones(ramp) / ramp, mode="same")
    music[:] = tmp + seg * w

for h in T.get("heartbeats", []):
    add(fx, heartbeat(), h / FPS, 0.9)
for h in T.get("hits", []):
    add(fx, whoosh(), h / FPS - 0.55, 0.12)
    add(fx, boom(), h / FPS, 0.75)
for h in T.get("boing", []):
    add(fx, boing(), h / FPS, 0.5)

fade = np.clip((DUR - np.arange(N) / SR) / 2.0, 0, 1)
mix = music * fade / (np.max(np.abs(music)) / 0.7) + fx * 0.75
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix *= 0.85 / np.max(np.abs(mix))

os.makedirs("public/serie", exist_ok=True)
out = f"public/serie/ep{EP}-musica.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(out, round(DUR, 1), "s")
