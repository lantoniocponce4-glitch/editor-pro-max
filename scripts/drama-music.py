#!/usr/bin/env python3
"""
Música del mini drama "Amor en Fit Life": piano y cuerdas emotivas (La menor),
latidos en la apertura, golpes graves con "whoosh" en los momentos dramáticos y
un corte de tensión cuando aparece la mascota. Tiempos en src/compositions/drama-timing.json.
Uso: python3 scripts/drama-music.py
     npx remotion ffmpeg -y -i public/drama/musica.wav -b:a 160k public/drama/musica.mp3
Requiere numpy.
"""
import json
import os
import wave

import numpy as np

T = json.load(open("src/compositions/drama-timing.json"))
FPS = T["fps"]
SC = T["scenes"]
DUR = (SC["final"][0] + SC["final"][1]) / FPS
SR = 44100
N = int(SR * DUR)
music = np.zeros(N)
fx = np.zeros(N)
rng = np.random.default_rng(7)


def add(track, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: N - i]
    track[i : i + len(sig)] += sig * gain


def hz(n):
    return 440.0 * 2 ** (n / 12)


def piano(freq, length=2.2):
    t = np.arange(int(SR * length)) / SR
    env = np.exp(-t * 2.2) * np.minimum(1, t / 0.004)
    s = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 3) + 0.2 * np.sin(6 * np.pi * freq * t) * np.exp(-t * 5)
    return env * s


def strings(freqs, length, attack=0.6):
    t = np.arange(int(SR * length)) / SR
    env = np.minimum(1, t / attack) * np.minimum(1, (length - t) / 0.5)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.004, 0, 0.005):  # coro de violines levemente desafinados
            ff = f * (1 + det)
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t)
            ph = 2 * np.pi * np.cumsum(ff * vib) / SR
            s += np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return env * s / (len(freqs) * 3)


def heartbeat():
    def thump(f0, length, g):
        t = np.arange(int(SR * length)) / SR
        return g * np.sin(2 * np.pi * (f0 * np.exp(-t * 6)) * t) * np.exp(-t * 18)
    a = thump(70, 0.25, 1.0)
    b = thump(60, 0.25, 0.7)
    out = np.zeros(int(SR * 0.5))
    out[: len(a)] += a
    j = int(SR * 0.18)
    out[j : j + len(b)] += b[: len(out) - j]
    return out


def boom():
    t = np.arange(int(SR * 2.2)) / SR
    sub = np.sin(2 * np.pi * (34 + 40 * np.exp(-t * 7)) * t) * np.exp(-t * 1.8)
    noise = rng.standard_normal(len(t)) * np.exp(-t * 25) * 0.5
    return sub + noise


def whoosh(length=0.6):
    n = int(SR * length)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # filtro paso bajo que se abre: suavizado con ventana que se acorta
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        a = 0.02 + 0.5 * (i / n) ** 2
        acc += a * (noise[i] - acc)
        out[i] = acc
    return out * (t / length) ** 2


def sting(freq):
    t = np.arange(int(SR * 0.45)) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2 * t)) * np.exp(-t * 6) * np.minimum(1, t / 0.005)


# 1) Apertura: zumbido grave y latidos
add(music, strings([hz(-36), hz(-24)], SC["apertura"][1] / FPS + 0.5, attack=2.5), 0, 0.35)
for h in T["heartbeats"]:
    add(fx, heartbeat(), h / FPS, 0.9)

# 2) Piano y cuerdas: Am - F - C - G a 72 ppm desde el título hasta el giro
BPM = 72
BEAT = 60 / BPM
prog = [(-12, [0, 3, 7]), (-16, [-4, 0, 3]), (-9, [-9, -5, -2]), (-14, [-2, 2, 5])]  # Am F C G (semitonos desde La4)
t0 = SC["titulo"][0] / FPS
t_end = SC["giro"][0] / FPS
melody = [12, 10, 7, 8, 7, 5, 3, 5, 7, 8, 10, 12, 15, 14, 12, 10]  # línea alta para el clímax
bar = 0
t = t0
while t < t_end - 0.1:
    root, triad = prog[bar % 4]
    length = min(4 * BEAT, t_end - t)
    climax = t >= SC["momento"][0] / FPS
    add(music, strings([hz(root - 12)] + [hz(x - 12) for x in triad], length + 0.4, attack=0.8), t, 0.55 if climax else 0.42)
    arp = [triad[0], triad[1], triad[2], triad[1] + 12, triad[2], triad[1], triad[0] + 12, triad[2]]
    for k, n in enumerate(arp):
        tk = t + k * BEAT / 2
        if tk < t_end - 0.05:
            add(music, piano(hz(n)), tk, 0.16)
    if climax:
        for k in range(2):
            n = melody[(bar * 2 + k) % len(melody)]
            add(music, piano(hz(n), 3.0), t + k * 2 * BEAT, 0.22)
    t += 4 * BEAT
    bar += 1

# 3) Giro: silencio tenso y dos notas graves cómicas
for f, n in ((1280, -31), (1320, -32)):
    add(fx, sting(hz(n)), f / FPS, 0.9)
add(music, strings([hz(-25), hz(-19)], SC["giro"][1] / FPS, attack=0.4), SC["giro"][0] / FPS, 0.3)

# 4) Final: acorde sostenido
add(music, strings([hz(-24), hz(-12), hz(-9), hz(-5)], SC["final"][1] / FPS, attack=0.3), SC["final"][0] / FPS, 0.6)
add(music, piano(hz(0), 3.5), SC["final"][0] / FPS + 0.2, 0.3)
add(music, piano(hz(-12), 3.5), SC["final"][0] / FPS + 0.2, 0.3)

# 5) Golpes con whoosh previo
for h in T["hits"]:
    th = h / FPS
    add(fx, whoosh(0.55), th - 0.55, 0.12)
    add(fx, boom(), th, 0.8)

fade = np.clip((DUR - np.arange(N) / SR) / 2.0, 0, 1)
music *= fade
mix = music / (np.max(np.abs(music)) / 0.7) + fx * 0.75
# limitador suave: sube el volumen general sin que los golpes saturen
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix *= 0.85 / np.max(np.abs(mix))

os.makedirs("public/drama", exist_ok=True)
with wave.open("public/drama/musica.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("public/drama/musica.wav listo", round(DUR, 1), "s")
