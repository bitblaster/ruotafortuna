# La Ruota della Fortuna – Gioco Web Libero

Un gioco ispirato al game show "La Ruota della Fortuna", completamente libero e senza scopo di lucro. È pensato per divertirsi con gli amici o in famiglia.

- Funziona in ogni browser moderno su PC e su dispositivi mobile.
- Sviluppato con Vite, TypeScript, React, Tailwind CSS e shadcn-ui.
- Chiunque è invitato a contribuire: nuove funzioni, revisione/aggiunta di frasi, miglioramenti all’interfaccia.

## Come giocare

- Apri il progetto in locale oppure usa l’istanza distribuita se disponibile.
- Interfaccia ottimizzata per tastiera, mouse e touch.
- Pannelli di gioco: ruota, puzzle, jolly e carte giocatore.
- Fino a 6 giocatori con punteggio individuale.
- Ruota con 24 spicchi inclusi passa-turno, bancarotta e jolly.
- Imposta la partita con preset salvabili (nomi giocatori, numero round, tipo round "normale"/"express", categoria frase per round) usando il local storage.
- Il jolly consente di annullare bancarotta, passa-turno o lettere assenti e continuare a giocare.
- Le frasi del tabellone sono scelte casualmente da `public/phrases.json`; gli ID usati vengono memorizzati nel local storage per evitare ripetizioni.
- Al termine viene mostrato un riepilogo con classifica e vincitore evidenziato.

## Installazione e avvio (locale)

```sh
# Requisiti: Node.js e npm
npm i
npm run dev
```

## Contribuire

Siamo felici di ricevere contributi!

- Aggiungi nuove funzioni o migliora quelle esistenti.
- Revisiona o aggiungi frasi al gioco (file in `public/phrases.json`).
- Apri una Pull Request descrivendo chiaramente le modifiche.

## Licenza e note sui contenuti

- Codice sorgente: GPLv3 (vedi `LICENSE`).
- Campioni audio: piccoli clip inclusi esclusivamente a fini dimostrativi in un contesto educativo/di parodia; tutti i diritti appartengono ai rispettivi possessori.

---

# Wheel of Fortune – Free Web Game

A game inspired by the "Wheel of Fortune" TV show, completely free and non-profit. Designed for having fun with friends or family.

- Works in every modern browser on desktop and mobile devices.
- Built with Vite, TypeScript, React, Tailwind CSS, and shadcn-ui.
- Everyone is welcome to contribute: new features, reviewing/adding phrases, UI improvements.

## How to Play

- Run locally or use a published instance if available.
- Interface optimized for keyboard, mouse, and touch.
- Game panels: wheel, puzzle, joker, and player cards.
- Up to 6 players with individual scoring.
- Wheel with 24 wedges including lose-a-turn, bankrupt, and joker.
- Configure matches with savable presets (player names, number of rounds, round type "normal"/"express", and per-round category) via local storage.
- Joker lets you negate bankrupt, lose-a-turn, or absent letters and continue playing.
- Board phrases are randomly chosen from `public/phrases.json`; used phrase IDs are stored in local storage to avoid repeats.
- A final summary shows the leaderboard with the winner highlighted.

## Install & Run (local)

```sh
# Requirements: Node.js and npm
npm i
npm run dev
```

## Contributing

We’re happy to accept contributions!

- Add new features or improve existing ones.
- Review or add phrases to the game (see `public/phrases.json`).
- Open a Pull Request with a clear description of your changes.

## License and Content Notes

- Source code: GPLv3 (see `LICENSE`).
- Audio samples: small clips included only for demonstrative purposes in an educational/parody context; all rights belong to their respective owners.
