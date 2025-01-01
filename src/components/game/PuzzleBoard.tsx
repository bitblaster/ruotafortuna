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

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import {BoardCell, layoutPhrase, normalizeChar} from '@/lib/boardLayout';
import { useGameStore } from '@/store/gameStore';

const PuzzleBoard = () => {
  const currentPhrase = useGameStore((s) => s.currentPhrase);
  const revealedLetters = useGameStore((s) => s.revealedLetters);
  const solveSequence = useGameStore((s) => s.solveSequence);
  const solveIndex = useGameStore((s) => s.solveIndex);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const grid = useMemo(() => currentPhrase ? layoutPhrase(currentPhrase.phrase) : [], [currentPhrase]);

  const maxCols = useMemo(() => Math.max(...grid.map(r => r.length), 1), [grid]);

  // Compute tile size: fill container width with maxCols tiles + gaps
  const gap = 4; // px gap between tiles
  const padding = 24; // px total horizontal padding inside the board
  const availableWidth = containerWidth - padding;
  const tileWidth = availableWidth > 0 ? Math.min(40, Math.floor((availableWidth - gap * (maxCols - 1)) / maxCols)) : 32;
  const tileHeight = Math.round(tileWidth * 1.25);
  const fontSize = Math.max(12, Math.round(tileWidth * 0.5));
  // Make border-radius proportional to tile size; cap to avoid circles
  const borderRadius = Math.min(Math.round(tileWidth * 0.15), Math.round(tileHeight * 0.25));

  if (!currentPhrase) return null;

  const isRevealed = (cell: BoardCell) => {
    const letter = normalizeChar(cell.letter.replace("'", ''));
    if(solveSequence.length > 0) {
      if(solveIndex >= solveSequence.length)
        return true;
      if(solveSequence.some((s) => normalizeChar(s.letter.replace("'", '')) === letter))
        return solveSequence[solveIndex].index > cell.index;
      else
        return revealedLetters.includes(letter);
    } else
      return revealedLetters.includes(normalizeChar(letter))
  };

  return (
    <div className="w-full max-w-2xl mx-auto" ref={containerRef}>
      <div className="rounded-xl p-3 sm:p-4" style={{ background: 'linear-gradient(135deg, hsl(222 47% 12%), hsl(222 47% 16%))' }}>
        <div className="text-center mb-2">
          <span className="text-xs uppercase tracking-widest font-display text-primary">
            {currentPhrase.category} — {currentPhrase.description}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {grid.map((row, ri) => (
            <div key={ri} className="flex" style={{ gap: `${gap}px` }}>
              {row.map((cell, ci) => {
                if (cell.letter === null) {
                  return <div key={ci} className="tile tile-empty opacity-20" style={{ width: tileWidth, height: tileHeight, fontSize, borderRadius }} />;
                }
                if (cell.letter === ' ') {
                  return <div key={ci} className="tile tile-space" style={{ width: tileWidth, height: tileHeight, borderRadius }} />;
                }
                const revealed = isRevealed(cell);
                return (
                  <div
                    key={ci}
                    className={`tile ${revealed ? 'tile-revealed' : 'tile-hidden'}`}
                    style={{ width: tileWidth, height: tileHeight, fontSize, borderRadius }}
                  >
                    {revealed ? cell.letter : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PuzzleBoard;
