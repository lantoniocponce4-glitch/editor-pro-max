#!/usr/bin/env python3
"""
Música para el video "Cumpleanos" (32 s): "Cumpleaños feliz" (melodía de dominio público)
en estilo caja musical, dos vueltas, con destellos sincronizados con el confeti y los regalos.
Uso: python3 scripts/cumpleanos-music.py
     npx remotion ffmpeg -y -i public/cumpleanos/musica.wav -b:a 128k public/cumpleanos/musica.mp3
Requiere numpy.
"""
import os
import wave

import numpy as np

SR = 44100
FPS = 30
DUR = 960 / FPS
BPM = 96
BEAT = 60 / BPM
out = np.zeros(int(SR * DUR))


def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(out):
        return
    sig = sig[: len(out) - i]
    out[i : i + len(sig)] += sig * gain


def hz(n):  # semitonos desde La4
    return 440.0 * 2 ** (n / 12)


def bell(freq, length=0.9):
    """Caja musical: fundamental + parciales inarmónicos que decaen rápido."""
    t = np.arange(int(SR * length)) / SR
    env = np.exp(-t * 4.5) * np.minimum(1, t / 0.003)
    sig = np.sin(2 * np.pi * freq * t)
    sig += 0.35 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t * 7)
    sig += 0.18 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 18)
    return env * sig


def pad(freqs, length):
    t = np.arange(int(SR * length)) / SR
    env = np.minimum(1, t / 0.08) * np.exp(-t * 1.4)
    return env * sum(np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t) for f in freqs) / len(freqs)


def sparkle(t0, n=7):
    rng = np.random.default_rng(int(t0 * 100))
    for k in range(n):
        add(bell(hz(15 + int(rng.integers(0, 12))), 0.4), t0 + k * 0.045, 0.08)


G4, A4, B4, C5, D5, E5, F5, G5 = -2, 0, 2, 3, 5, 7, 8, 10
# (nota, tiempos)
melody = [
    (G4, .75), (G4, .25),
    (A4, 1), (G4, 1), (C5, 1),
    (B4, 2), (G4, .75), (G4, .25),
    (A4, 1), (G4, 1), (D5, 1),
    (C5, 2), (G4, .75), (G4, .25),
    (G5, 1), (E5, 1), (C5, 1),
    (B4, 1), (A4, 1), (F5, .75), (F5, .25),
    (E5, 1), (C5, 1), (D5, 1),
    (C5, 3),
]
# acordes por compás (raíz grave, tríada) después del tiempo de anacrusa
CH = {"C": (-21, [3, 7, 10]), "G": (-26, [-2, 2, 5]), "F": (-28, [-4, 0, 3])}
bars = ["C", "G", "G", "C", "C", "F", "G", "C"]
VERSE_BEATS = 25


def verse(t0, harmony=False):
    t = t0
    for n, b in melody:
        add(bell(hz(n + 12)), t, 0.30)
        if harmony and b >= 1:
            add(bell(hz(n + 12 - 4)), t, 0.10)
        t += b * BEAT
    for i, name in enumerate(bars):
        root, triad = CH[name]
        bt = t0 + (1 + i * 3) * BEAT
        add(pad([hz(root)], 3 * BEAT), bt, 0.30)
        for k in (1, 2):  # vals: bajo en el 1, acorde en el 2 y el 3
            add(pad([hz(x) for x in triad], BEAT * 0.9), bt + k * BEAT, 0.12)


start = 0.35
verse(start)
verse(start + VERSE_BEATS * BEAT + BEAT * 0.5, harmony=True)

# destellos: título, confeti de la foto, regalos y escena final
sparkle(0.15)
sparkle((290 + 14) / FPS, 10)
for f in (20, 34, 48, 62):
    sparkle((470 + f) / FPS, 4)
sparkle((770 + 8) / FPS, 8)

fade_out = np.clip((DUR - np.arange(len(out)) / SR) / 1.5, 0, 1)
out *= fade_out
out /= np.max(np.abs(out)) / 0.9

os.makedirs("public/cumpleanos", exist_ok=True)
with wave.open("public/cumpleanos/musica.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("public/cumpleanos/musica.wav listo", round(start + (2 * VERSE_BEATS + 0.5) * BEAT, 1), "s de melodía")
