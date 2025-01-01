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

export interface BoardCell {
  letter: string | null; // null = empty slot, ' ' = space, 'A' = letter, "L'" = letter+apostrophe
  index: number; // unique index for this cell, used for tracking revealed letters
}

const ROW_SIZES = [12, 14, 14, 12];

/**
 * Token cell width: apostrophes merge with the preceding letter.
 * "DELL'" → 4 cells: D, E, L, L'
 */
function tokenCellWidth(token: string): number {
  let w = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "'") continue;
    w++;
  }
  return w;
}

function groupWidth(group: string[]): number {
  let w = 0;
  for (let i = 0; i < group.length; i++) {
    if (i > 0) w++; // space between tokens in group
    w += tokenCellWidth(group[i]);
  }
  return w;
}

function tokenToCells(token: string, count: number): BoardCell[] {
  const cells: BoardCell[] = [];
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "'" && cells.length > 0) {
      // merge apostrophe with previous cell
      cells[cells.length - 1].letter += "'";
      continue;
    }
    cells.push({ letter: token[i], index: count++ });
  }
  return cells;
}

export function normalizeChar(c: string): string {
  return c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export function layoutPhrase(phrase: string): BoardCell[][] {
  const rawWords = phrase.split(' ');

  // Expand apostrophe words into groups of tokens
  // "DELL'AMORE" → ["DELL'", "AMORE"]  (kept together on same row if possible)
  const groups: string[][] = [];
  for (const word of rawWords) {
    const parts = word.split("'");
    if (parts.length === 1) {
      groups.push([word]);
    } else {
      const tokens: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        if (i < parts.length - 1) {
          tokens.push(parts[i] + "'");
        } else {
          if (parts[i]) tokens.push(parts[i]);
        }
      }
      groups.push(tokens);
    }
  }

  // Place groups into rows
  const rowGroups: string[][][] = [[], [], [], []];
  let currentRow = 0;
  let currentUsed = 0;

  for (const group of groups) {
    const gw = groupWidth(group);
    const needed = currentUsed === 0 ? gw : gw + 1;

    if (currentUsed + needed > ROW_SIZES[currentRow]) {
      currentRow++;
      currentUsed = 0;
      if (currentRow >= 4) break;
    }
    if (currentUsed > 0) currentUsed++; // space between groups
    currentUsed += gw;
    rowGroups[currentRow].push(group);
  }

  // Build grid
  let count = 0;
  const grid: BoardCell[][] = [];
  for (let r = 0; r < 4; r++) {
    // Build content cells for this row
    const content: BoardCell[] = [];
    for (let g = 0; g < rowGroups[r].length; g++) {
      if (g > 0) content.push({ letter: ' ', index: -1 }); // space between groups
      const group = rowGroups[r][g];
      for (let t = 0; t < group.length; t++) {
        if (t > 0) content.push({ letter: ' ', index: count++ }); // space after apostrophe token
        const cells = tokenToCells(group[t], count);
        count += cells.length;
        content.push(...cells);
      }
    }

    const row: BoardCell[] = [];
    const start = Math.floor((ROW_SIZES[r] - content.length) / 2);
    for (let c = 0; c < ROW_SIZES[r]; c++) {
      const ci = c - start;
      if (ci >= 0 && ci < content.length) {
        row.push(content[ci]);
      } else {
        row.push({ letter: null, index: -1 });
      }
    }
    grid.push(row);
  }
  return grid;
}
