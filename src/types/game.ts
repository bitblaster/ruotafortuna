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

export interface Phrase {
  id: number;
  phrase: string;
  description: string;
  category: string;
}

export interface Player {
  id: number;
  name: string;
  roundScore: number;
  totalScore: number;
  hasJolly: boolean;
}

export interface RoundConfig {
  type: 'normale' | 'express';
  category: string;
}

export interface Preset {
  name: string;
  playerNames: string[];
  rounds: RoundConfig[];
  hideCalledLetters?: boolean;
}

export type WheelValue = number | string;

export type GamePhase = 'setup' | 'playing' | 'round-end' | 'game-over';

export type TurnPhase =
  | 'awaiting-action'
  | 'spinning'
  | 'consonant-guess'
  | 'vowel-guess'
  | 'solving'
  | 'jolly-prompt'
  | 'express-guess'
  | 'solving-interactive';
