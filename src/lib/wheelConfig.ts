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

export const NORMAL_WHEEL: (number | string)[] = [
  'Bancarotta', 1000, 200, 700, 300, 600, 'Passa', 800, 400, 100, 500, 300,
  'Bancarotta', 800, 200, 600, 300, 500, 'Passa', 400, 200, 700, 100, 500,
];

export const EXPRESS_WHEEL: (number | string)[] = [
  'Bancarotta', 4000, 200, 700, 300, 600, 'Passa', 800, 'Express', 100, 500, 300,
  'Bancarotta', 800, 'Express', 600, 300, 500, 'Passa', 400, 200, 700, 'Express', 500,
];

export const JOLLY_INDEX = 20;
const HUE_PALETTE = [
  '#000000', '#03870d', 
  '#9b59b6', '#1f1c46', '#202c77', '#2e468c', '#ffffff',
  '#9b59b6', '#1f1c46', '#202c77', '#2e468c', '#0952aa', '#000000', 
  '#9b59b6', '#1f1c46', '#202c77', '#2e468c', '#0952aa', '#ffffff',
  '#9b59b6', '#1f1c46', '#202c77', '#2e468c', '#0952aa'
];

//03870d verde 1000
//2e468c blu chiaro
//202c77 blu medio
//1f1c46 blu scuro
//0952aa blu 500
//9b59b6 viola

export function getSegmentColor(value: number | string, index: number): string {
  if (value === 'Bancarotta') return '#0d0d0d';
  if (value === 'Passa') return '#ffffff';
  if (value === 'Express') return '#7c3aed';
  if (index === JOLLY_INDEX) return '#d97706';
  return HUE_PALETTE[index % HUE_PALETTE.length];
}

export function getSegmentTextColor(value: number | string): string {
  if (value === 'Passa') return '#1e293b';
  return '#ffffff';
}

export function getSegmentLabel(value: number | string): string {
  if (typeof value === 'number') return value.toString();
  return value.toUpperCase();
}

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];
export const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
