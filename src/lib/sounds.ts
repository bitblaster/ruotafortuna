/*
 * Copyright (C) 2026 Bitblaster
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// src/lib/sound.ts
// Manager semplice per suoni .ogg (preload + play)

const sources: Record<string, string> = {
    spin: '/sounds/spin.ogg',
    tick: '/sounds/tick.ogg',
    bankrupt: '/sounds/bankrupt.ogg',
    error: '/sounds/error.ogg',
    high: '/sounds/high.ogg',
    jolly: '/sounds/jolly.ogg',
    letter: '/sounds/letter.ogg',
    pass: '/sounds/pass.ogg',
    prize: '/sounds/prize.ogg',
    s100: '/sounds/100.ogg',
    s200: '/sounds/200.ogg',
    s300: '/sounds/300.ogg',
    s400: '/sounds/400.ogg',
    s500: '/sounds/500.ogg',
    s600: '/sounds/600.ogg',
    s700: '/sounds/700.ogg',
    s800: '/sounds/800.ogg',
    s1000: '/sounds/1000.ogg',
    s4000: '/sounds/4000.ogg',
};

const cache = new Map<string, HTMLAudioElement>();

export function preloadSounds() {
    (Object.keys(sources) as string[]).forEach((k) => {
        const a = new Audio(sources[k]);
        a.preload = 'auto';
        cache.set(k, a);
    });
}

export function playSound(key: string, { volume = 1.0, rate = 1.0 } = {}) {
    const base = cache.get(key) ?? new Audio(sources[key]);
    // Clona per permettere sovrapposizione di suoni
    const a = base.cloneNode(true) as HTMLAudioElement;
    a.volume = volume;
    a.playbackRate = rate;
    a.play().catch(() => {/* ignorare errori di autoplay senza gesture */});
}

// Rate limiter: minimo intervallo tra riproduzioni per chiave
const lastPlayAt = new Map<string, number>();

export function playSoundThrottled(key: string, minIntervalMs: number, opts: { volume?: number; rate?: number } = {}) {
    const now = performance.now();
    const last = lastPlayAt.get(key) ?? 0;
    if (now - last < minIntervalMs) return; // skip se troppo ravvicinato
    lastPlayAt.set(key, now);
    playSound(key, opts);
}

// opzionale: stop globale
export function stopAll() {
    cache.forEach((a) => { a.pause(); a.currentTime = 0; });
}
