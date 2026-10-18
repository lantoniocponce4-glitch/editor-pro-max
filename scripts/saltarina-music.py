#!/usr/bin/env python3
"""
Música y efectos para el video "Saltarina" (56 s).
Uso: python3 scripts/saltarina-music.py  ->  public/saltarina/musica.wav
Luego se convierte a MP3 con:  npx remotion ffmpeg -y -i public/saltarina/musica.wav -b:a 128k public/saltarina/musica.mp3
Requiere numpy.
"""
import os
import wave

import numpy as np

SR = 44100
DUR = 56.0
BPM = 120
BEAT = 60 / BPM
out = np.zeros(int(SR * DUR))


def add(sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(out):
        return
    sig = sig[: len(out) - i]
    out[i : i + len(sig)] += sig * gain


def note_hz(n):  # n = semitonos desde La4 (440 Hz)
    return 440.0 * 2 ** (n / 12)


def marimba(freq, length=0.45):
    t = np.arange(int(SR * length)) / SR
    env = np.exp(-t * 9)
    attack = np.minimum(1, t / 0.004)
    return attack * env * (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 3.9 * t) * np.exp(-t * 30))


def bass(freq, length):
    t = np.arange(int(SR * length)) / SR
    env = np.exp(-t * 2.2) * np.minimum(1, t / 0.01)
    return env * (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t))


def shaker(length=0.06):
    n = np.random.default_rng(1).standard_normal(int(SR * length))
    n = np.diff(n, prepend=0)  # agudo
    return n * np.exp(-np.arange(len(n)) / (SR * 0.015))


def sweep(f0, f1, length, wobble=0.0):
    t = np.arange(int(SR * length)) / SR
    f = np.interp(t, [0, length], [f0, f1]) * (1 + wobble * np.sin(2 * np.pi * 9 * t))
    phase = 2 * np.pi * np.cumsum(f) / SR
    env = np.sin(np.pi * t / length) ** 0.6
    return env * np.sin(phase)


# Do mayor: C G Am F  (un compás = 4 tiempos = 2 s)
C4, D4, E4, G4, A4, C5, D5, E5 = -9, -7, -5, -2, 0, 3, 5, 7
chords = [(-21, [C4, E4, G4]), (-26, [-14, -10, -7]), (-24, [-12, -9, -5]), (-28, [-16, -12, -9])]
# melodía pentatónica en corcheas (None = silencio), 4 compases
melody = [
    E5, D5, C5, D5, E5, None, E5, None,
    D5, None, G4, A4, D5, C5, None, None,
    C5, A4, G4, A4, C5, None, E5, D5,
    C5, D5, E5, G4, A4, None, C5, None,
]

bar_len = 4 * BEAT
t = 0.0
bar = 0
while t < DUR - 2.5:
    root, triad = chords[bar % 4]
    add(bass(note_hz(root), bar_len * 0.95), t, 0.32)
    for k in range(4):  # acordes suaves en los tiempos 2 y 4
        if k % 2 == 1:
            for n in triad:
                add(marimba(note_hz(n + 12), 0.3), t + k * BEAT, 0.07)
    for k in range(8):  # shaker en contratiempo
        if k % 2 == 1:
            add(shaker(), t + k * BEAT / 2, 0.05)
    for k in range(8):
        n = melody[(bar % 4) * 8 + k]
        if n is not None:
            add(marimba(note_hz(n)), t + k * BEAT / 2, 0.22)
    t += bar_len
    bar += 1

# efectos sincronizados con los saltos (segundos = cuadro / 30)
for jump in [22, 610, 670, 730, 1170, 1632]:
    s = jump / 30
    add(sweep(260, 720, 0.18), s, 0.25)
    add(sweep(720, 380, 0.16), s + 0.18, 0.18)
add(sweep(1100, 320, 0.9, wobble=0.04), 862 / 30, 0.2)  # bajada por el hilo
# zumbido de la mosca (escena 6)
t_buzz = np.arange(int(SR * 5.2)) / SR
buzz = np.sign(np.sin(2 * np.pi * (170 + 25 * np.sin(2 * np.pi * 5 * t_buzz)) * t_buzz))
buzz *= np.minimum(1, t_buzz / 0.3) * np.clip((5.2 - t_buzz) / 0.6, 0, 1)
add(buzz, 1050 / 30 + 0.2, 0.025)

# fundidos y normalización
fade_in = np.minimum(1, np.arange(len(out)) / (SR * 0.4))
fade_out = np.clip((DUR - np.arange(len(out)) / SR) / 3.0, 0, 1)
out *= fade_in * fade_out
out /= np.max(np.abs(out)) / 0.95

os.makedirs("public/saltarina", exist_ok=True)
with wave.open("public/saltarina/musica.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("public/saltarina/musica.wav listo")
