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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star } from 'lucide-react';

const JollyDialog = () => {
  const jollyReason = useGameStore((s) => s.jollyReason);
  const useJolly = useGameStore((s) => s.useJolly);
  const declineJolly = useGameStore((s) => s.declineJolly);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);

  const player = players[currentPlayerIndex];
  const isOpen = jollyReason !== null;

  const reasonText = {
    bancarotta: 'Hai fatto Bancarotta! Vuoi usare il Jolly per salvare il tuo punteggio e mantenere il turno?',
    passa: 'Hai fatto Passa! Vuoi usare il Jolly per mantenere il turno?',
    wrongLetter: 'Lettera non presente! Vuoi usare il Jolly per mantenere il turno?',
    usedLetter: 'Lettera già usata/rivelata! Vuoi usare il Jolly per mantenere il turno?',
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display flex items-center gap-2">
            <Star className="w-5 h-5 text-jolly fill-jolly" />
            Jolly — {player?.name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {jollyReason && reasonText[jollyReason]}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={declineJolly}>No, rinuncia</AlertDialogCancel>
          <AlertDialogAction onClick={useJolly}>Usa il Jolly!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default JollyDialog;
