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

import { useGameStore } from '@/store/gameStore';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SolvePanel = () => {
  const solveLetterAttempt = useGameStore((s) => s.solveLetterAttempt);
  const cancelSolving = useGameStore((s) => s.cancelSolving);
  const solveSequence = useGameStore((s) => s.solveSequence);
  const solveIndex = useGameStore((s) => s.solveIndex);

  const remaining = solveSequence.length - solveIndex;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      {(remaining > 0) && (
          <div className="rounded-xl p-3 sm:p-4" style={{ background: 'linear-gradient(135deg, hsl(222 47% 12%), hsl(222 47% 16%))' }}>
          <div className="text-center mb-3">
            <span className="text-sm font-display text-primary">
              Clicca le lettere mancanti in ordine — {remaining} rimaste
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => solveLetterAttempt(letter)}
                className="letter-btn letter-btn-available w-9 h-9 text-sm font-display"
              >
                {letter}
              </button>
            ))}
          </div>
          <div className="text-center mt-3">
            <button
              onClick={cancelSolving}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolvePanel;
