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

import { create } from 'zustand';
import { Player, RoundConfig, Phrase, GamePhase, TurnPhase } from '@/types/game';
import { NORMAL_WHEEL, EXPRESS_WHEEL, JOLLY_INDEX } from '@/lib/wheelConfig';
import {normalizeChar, layoutPhrase, BoardCell} from '@/lib/boardLayout';
import {playSound} from "@/lib/sounds.ts";

const ERROR_DURATION = 1500;

interface GameStore {
  players: Player[];
  rounds: RoundConfig[];
  phrases: Phrase[];
  gamePhase: GamePhase;
  turnPhase: TurnPhase;
  currentRound: number;
  currentPlayerIndex: number;
  currentPhrase: Phrase | null;
  revealedLetters: string[];
  usedConsonants: string[];
  usedVowels: string[];
  wheelValue: number | null;
  usedPhraseIds: number[];
  isExpressMode: boolean;
  jollyReason: 'bancarotta' | 'passa' | 'wrongLetter' | 'usedLetter' | null;
  jollyPending: boolean;
  jollyUsed: boolean;
  message: string;
  hideCalledLetters: boolean;

  // Interactive solve state
  solveSequence: BoardCell[];
  solveIndex: number;
  solveSnapshot: string[];

  initGame: (players: Player[], rounds: RoundConfig[], phrases: Phrase[], hideCalledLetters?: boolean) => void;
  startRound: (forcePhraseId?: number) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  handleWheelResult: (value: number | string, index: number) => void;
  guessConsonant: (letter: string) => void;
  buyVowel: (letter: string) => void;
  useJolly: () => void;
  declineJolly: () => void;
  nextPlayer: () => void;
  winRound: () => void;
  manageUsedLetter: (letter: string) => void;
  nextRound: () => void;
  setMessage: (msg: string) => void;
  getActiveWheel: () => (number | string)[];
  allLettersRevealed: () => boolean;
  resetGame: () => void;
  startSolving: () => void;
  solveLetterAttempt: (letter: string) => void;
  cancelSolving: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  rounds: [],
  phrases: [],
  gamePhase: 'setup',
  turnPhase: 'awaiting-action',
  currentRound: 0,
  currentPlayerIndex: 0,
  currentPhrase: null,
  revealedLetters: [],
  usedConsonants: [],
  usedVowels: [],
  wheelValue: null,
  usedPhraseIds: [],
  isExpressMode: false,
  jollyReason: null,
  jollyPending: false,
  jollyUsed: false,
  message: '',
  hideCalledLetters: false,
  solveSequence: [],
  solveIndex: 0,
  solveSnapshot: [],

  initGame: (players, rounds, phrases, hideCalledLetters = false) => {
    const usedIds: number[] = JSON.parse(localStorage.getItem('usedPhraseIds') || '[]');
    set({
      players,
      rounds,
      phrases,
      usedPhraseIds: usedIds,
      gamePhase: 'setup',
      currentRound: 0,
      hideCalledLetters,
    });
  },

  startRound: (forcePhraseId?: number) => {
    const { rounds, currentRound, phrases, usedPhraseIds } = get();
    const round = rounds[currentRound];

    let phrase: Phrase | undefined;

    if (forcePhraseId !== undefined) {
      phrase = phrases.find((p) => p.id === forcePhraseId);
    }

    if (!phrase) {
      let pool = round.category === '__any__'
        ? phrases.filter((p) => !usedPhraseIds.includes(p.id))
        : phrases.filter((p) => p.category === round.category && !usedPhraseIds.includes(p.id));
      if (pool.length === 0) {
        pool = phrases.filter((p) => !usedPhraseIds.includes(p.id));
      }
      if (pool.length === 0) {
        localStorage.setItem('usedPhraseIds', '[]');
        pool = phrases.filter((p) => p.category === round.category);
        if (pool.length === 0) pool = phrases;
        set({ usedPhraseIds: [] });
      }
      phrase = pool[Math.floor(Math.random() * pool.length)];
    }
    const newUsedIds = [...get().usedPhraseIds, phrase.id];
    localStorage.setItem('usedPhraseIds', JSON.stringify(newUsedIds));

    set({
      currentPhrase: phrase,
      usedPhraseIds: newUsedIds,
      gamePhase: 'playing',
      turnPhase: 'awaiting-action',
      currentPlayerIndex: 0,
      revealedLetters: [],
      usedConsonants: [],
      usedVowels: [],
      wheelValue: null,
      isExpressMode: false,
      jollyReason: null,
      message: `Round ${currentRound + 1}: ${round.category} — ${phrase.description}`,
      players: get().players.map((p) => ({ ...p, roundScore: 0 })),
    });
  },

  setTurnPhase: (phase) => set({ turnPhase: phase }),

  handleWheelResult: (value, index) => {
    const { players, currentPlayerIndex, jollyUsed } = get();
    const player = players[currentPlayerIndex];
    const jollyClaimed = players.some(p => p.hasJolly);

    if (value === 'Bancarotta') {
      playSound('bankrupt');
      if (player.hasJolly) {
        set({ jollyReason: 'bancarotta', turnPhase: 'jolly-prompt', message: `Bancarotta! ${player.name}, vuoi usare il Jolly?` });
      } else {
        const np = [...players];
        np[currentPlayerIndex] = { ...player, roundScore: 0 };
        set({ players: np, message: `Bancarotta! ${player.name} perde tutto!` });
        setTimeout(() => get().nextPlayer(), ERROR_DURATION);
      }
    } else if (value === 'Passa') {
      playSound('pass');
      if (player.hasJolly) {
        set({ jollyReason: 'passa', turnPhase: 'jolly-prompt', message: `Passa! ${player.name}, vuoi usare il Jolly?` });
      } else {
        set({ message: `Passa! Turno di ${player.name} saltato.` });
        setTimeout(() => get().nextPlayer(), ERROR_DURATION);
      }
    } else if (value === 'Express') {
      playSound('prize');
      set({ isExpressMode: true, wheelValue: 1000, turnPhase: 'express-guess', message: `Express! ${player.name} deve indovinare consonanti!` });
    } else if (index === JOLLY_INDEX && !jollyClaimed && !jollyUsed) {
      playSound('s200');
      set({ jollyPending: true, wheelValue: 200, turnPhase: 'consonant-guess', message: `${player.name} può ottenere il Jolly! Valore: 200 — Scegli una consonante!` });
    } else if (typeof value === 'number') {
      if(value >= 1000)
        playSound('high');
      else
        playSound("s" + value);

      set({ wheelValue: value, turnPhase: 'consonant-guess', message: `Valore: ${value}. Scegli una consonante!` });
    }
  },

  manageUsedLetter: (letter: string) => {
    playSound('error');
    const { players, currentPlayerIndex, isExpressMode } = get();

    if (players[currentPlayerIndex].hasJolly) {
      set({ jollyReason: 'usedLetter', turnPhase: 'jolly-prompt', message: `${letter} già usata/rivelata! Vuoi usare il Jolly?` });
    } else {
      if(isExpressMode) {
        setTimeout(() => playSound('bankrupt'), ERROR_DURATION);
        const np = [...players];
        np[currentPlayerIndex] = {...players[currentPlayerIndex], roundScore: 0};
        set({
          players: np,
          isExpressMode: false,
          message: `${letter} già usata/rivelata! Express fallito! ${players[currentPlayerIndex].name} perde tutto!`,
        });
      } else {
        set({message: `${letter} già usata/rivelata! Passa il turno`});
      }
      setTimeout(() => get().nextPlayer(), ERROR_DURATION);
    }
  },

  guessConsonant: (letter) => {
    const { currentPhrase, players, currentPlayerIndex, wheelValue, revealedLetters, usedConsonants, isExpressMode } = get();
    if (!currentPhrase || wheelValue === null && !isExpressMode) return;

    const normalized = normalizeChar(letter);
    // Guard: evita doppio conteggio
    if (revealedLetters.includes(normalized) || usedConsonants.includes(normalized)) {
      get().manageUsedLetter(letter);
      return;
    }
    const newUsedConsonants = usedConsonants.includes(normalized) ? usedConsonants : [...usedConsonants, normalized];
    const count = [...currentPhrase.phrase].filter((c) => c !== ' ' && normalizeChar(c) === normalized).length;

    if (count > 0) {
      playSound('letter');
      const np = [...players];
      const updatedPlayer = {
        ...players[currentPlayerIndex],
        roundScore: players[currentPlayerIndex].roundScore + wheelValue * count,
      };
      // Grant jolly if pending and consonant was found
      if (get().jollyPending) {
        playSound('jolly');
        updatedPlayer.hasJolly = true;
      }
      np[currentPlayerIndex] = updatedPlayer;
      const newRevealed = [...revealedLetters, normalized];
      set({
        players: np,
        revealedLetters: newRevealed,
        usedConsonants: newUsedConsonants,
        jollyPending: false,
        message: get().jollyPending
          ? `${letter} presente ${count} volta/e! +${wheelValue * count} punti — Jolly ottenuto!`
          : isExpressMode ?
            `Express! ${letter} × ${count}! +${1000 * count}`
            : `${letter} presente ${count} volta/e! +${wheelValue * count} punti`,
      });
      if(!isExpressMode) {
        set({ turnPhase: 'awaiting-action' });
      }
      // Check all revealed
      const allChars = [...new Set([...currentPhrase.phrase].filter((c) => c !== ' ').map((c) => normalizeChar(c)))];
      if (allChars.every((c) => newRevealed.includes(c))) {
        get().winRound();
      }
    } else {
      playSound('error');
      set({ usedConsonants: newUsedConsonants, jollyPending: false });
      const player = players[currentPlayerIndex];
      if (player.hasJolly) {
        set({ jollyReason: 'wrongLetter', turnPhase: 'jolly-prompt', message: `${letter} non presente! Vuoi usare il Jolly?` });
      } else {
        if(isExpressMode) {
          setTimeout(() => playSound('bankrupt'), ERROR_DURATION);
          const np = [...players];
          np[currentPlayerIndex] = { ...players[currentPlayerIndex], roundScore: 0 };
          set({
            players: np,
            isExpressMode: false,
            message: `${letter} non presente! Express fallito! ${players[currentPlayerIndex].name} perde tutto!`,
          });
        } else {
          set({message: `${letter} non presente! Turno passa.`});
        }

        setTimeout(() => get().nextPlayer(), ERROR_DURATION);
      }
    }
  },

  buyVowel: (letter) => {
    const { currentPhrase, players, currentPlayerIndex, revealedLetters, usedVowels, isExpressMode } = get();
    if (!currentPhrase) return;

    const normalized = normalizeChar(letter);
    const np = [...players];
    np[currentPlayerIndex] = {
      ...players[currentPlayerIndex],
      roundScore: players[currentPlayerIndex].roundScore - 500,
    };

    if (revealedLetters.includes(normalized) || usedVowels.includes(normalized)) {
      get().manageUsedLetter(letter);
      return;
    }

    const newUsedVowels = [...usedVowels, normalized];
    const count = [...currentPhrase.phrase].filter((c) => c !== ' ' && normalizeChar(c) === normalized).length;

    const newRevealed = count > 0 ? [...revealedLetters, normalized] : revealedLetters;
    set({
      players: np,
      revealedLetters: newRevealed,
      usedVowels: newUsedVowels,
      turnPhase: isExpressMode ? 'express-guess' : 'awaiting-action',
      message: count > 0 ? `${letter} presente ${count} volta/e!` : `${letter} non presente!`,
    });

    if (count > 0) {
      const allChars = [...new Set([...currentPhrase.phrase].filter((c) => c !== ' ').map((c) => normalizeChar(c)))];
      if (allChars.every((c) => newRevealed.includes(c))) {
        get().winRound();
      }
    }
  },

  useJolly: () => {
    const { players, currentPlayerIndex, isExpressMode } = get();
    const np = [...players];
    np[currentPlayerIndex] = { ...players[currentPlayerIndex], hasJolly: false };
    set({ players: np, jollyReason: null, jollyUsed: true, turnPhase: isExpressMode ? 'express-guess' : 'awaiting-action', message: `${players[currentPlayerIndex].name} usa il Jolly!` });
  },

  declineJolly: () => {
    const { jollyReason, players, currentPlayerIndex, isExpressMode } = get();
    set({ jollyReason: null });

    if (jollyReason === 'bancarotta') {
      const np = [...players];
      np[currentPlayerIndex] = { ...players[currentPlayerIndex], roundScore: 0 };
      set({ players: np, message: `Bancarotta! ${players[currentPlayerIndex].name} perde tutto!` });
      setTimeout(() => get().nextPlayer(), ERROR_DURATION);
    } else if(isExpressMode) {
      const np = [...players];
      np[currentPlayerIndex] = {...players[currentPlayerIndex], roundScore: 0};
      set({
        players: np,
        isExpressMode: false,
        message: `Express fallito! ${players[currentPlayerIndex].name} perde tutto!`,
      });
      setTimeout(() => get().nextPlayer(), ERROR_DURATION);
    } else
      get().nextPlayer();
  },

  nextPlayer: () => {
    const { players, currentPlayerIndex } = get();
    const next = (currentPlayerIndex + 1) % players.length;
    set({
      currentPlayerIndex: next,
      turnPhase: 'awaiting-action',
      wheelValue: null,
      isExpressMode: false,
      message: `Turno di ${players[next].name}`,
    });
  },

  winRound: () => {
    const { players, currentPlayerIndex, currentPhrase } = get();
    const winner = players[currentPlayerIndex];
    const np = players.map((p, i) => ({
      ...p,
      totalScore: i === currentPlayerIndex ? p.totalScore + p.roundScore : p.totalScore,
    }));
    const allLetters = currentPhrase
      ? [...new Set([...currentPhrase.phrase].filter((c) => c !== ' ').map((c) => normalizeChar(c)))]
      : [];
    set({
      players: np,
      gamePhase: 'round-end',
      revealedLetters: allLetters,
      message: `${winner.name} vince il round! +${winner.roundScore} punti!`,
    });
  },

  nextRound: () => {
    const { currentRound, rounds } = get();
    if (currentRound + 1 >= rounds.length) {
      set({ gamePhase: 'game-over', message: 'Partita terminata!' });
    } else {
      set({ currentRound: currentRound + 1 });
      get().startRound();
    }
  },

  setMessage: (msg) => set({ message: msg }),

  getActiveWheel: () => {
    const { rounds, currentRound } = get();
    return rounds[currentRound]?.type === 'express' ? EXPRESS_WHEEL : NORMAL_WHEEL;
  },

  allLettersRevealed: () => {
    const { currentPhrase, revealedLetters } = get();
    if (!currentPhrase) return false;
    const letters = [...new Set([...currentPhrase.phrase].filter((c) => c !== ' ').map((c) => normalizeChar(c)))];
    return letters.every((l) => revealedLetters.includes(l));
  },

  resetGame: () => {
    set({
      players: [],
      rounds: [],
      gamePhase: 'setup',
      turnPhase: 'awaiting-action',
      currentRound: 0,
      currentPlayerIndex: 0,
      currentPhrase: null,
      revealedLetters: [],
      usedConsonants: [],
      usedVowels: [],
      wheelValue: null,
      isExpressMode: false,
      jollyReason: null,
      jollyPending: false,
      jollyUsed: false,
      message: '',
      hideCalledLetters: false,
      solveSequence: [],
      solveIndex: 0,
      solveSnapshot: [],
    });
  },

  startSolving: () => {
    const { currentPhrase, revealedLetters } = get();
    if (!currentPhrase) return;

    // Build ordered sequence of unrevealed letters from the board layout
    const grid = layoutPhrase(currentPhrase.phrase);
    const sequence: BoardCell[] = [];
    for (const row of grid) {
      for (const cell of row) {
        if (cell.letter === null || cell.letter === ' ') continue;
        const letter = cell.letter.replace("'", '');
        const norm = normalizeChar(letter);
        if (!revealedLetters.includes(norm)) {
          sequence.push(cell);
        }
      }
    }

    set({
      turnPhase: 'solving-interactive',
      solveSequence: sequence,
      solveIndex: 0,
      solveSnapshot: [...revealedLetters],
      message: 'Risolvi: clicca le lettere mancanti in ordine!',
    });
  },

  solveLetterAttempt: (letter: string) => {
    const { solveSequence, solveIndex, solveSnapshot, revealedLetters, players, currentPlayerIndex, isExpressMode } = get();
    const norm = normalizeChar(letter);

    if (norm === normalizeChar(solveSequence[solveIndex].letter)) {
      // Correct - reveal this letter and advance
      const newRevealed = revealedLetters.includes(norm) ? revealedLetters : [...revealedLetters, norm];
      const newIndex = solveIndex + 1;

      // Check if all done
      if (newIndex >= solveSequence.length) {
        set({ revealedLetters: newRevealed,
          solveSequence: [],
          solveIndex: 0,
          solveSnapshot: [],
        });
        get().winRound();
        return;
      }

      set({
        revealedLetters: newRevealed,
        solveIndex: newIndex,
        message: `Corretto! Continua...`,
      });
    } else {
      // Wrong - revert and lose turn
      set({
        revealedLetters: solveSnapshot,
        solveSequence: [],
        solveIndex: 0,
        solveSnapshot: [],
      });

      if(isExpressMode) {
        const np = [...players];
        np[currentPlayerIndex] = { ...players[currentPlayerIndex], roundScore: 0 };
        set({
          players: np,
          isExpressMode: false,
          message: `${letter} non presente! Express fallito! ${players[currentPlayerIndex].name} perde tutto!`,
        });
      } else {
        set({
          message: 'Lettera sbagliata! Turno perso.',
        });
      }
      setTimeout(() => get().nextPlayer(), ERROR_DURATION);
    }
  },

  cancelSolving: () => {
    const { solveSnapshot } = get();
    set({
      revealedLetters: solveSnapshot,
      solveSequence: [],
      solveIndex: 0,
      solveSnapshot: [],
      turnPhase: 'awaiting-action',
      message: 'Risoluzione annullata.',
    });
  },
}));
