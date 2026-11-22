# Doodle Outpost - Multiplayer Prototype

2D side-view multiplayer shooter (landscape). Works on phone and PC.

## Folder structure
```
doodle-outpost/
├── docs/                  ← the game (upload this folder to GitHub Pages)
│   ├── index.html           screens, HUD, room, voice button
│   ├── css/style.css        colors and layout (Doodle Outpost design)
│   ├── js/data.js           SERVER URL, characters, maps, modes, weapons  ← edit SERVER_URL here
│   ├── js/game.js           movement, weapons, grenades, hits, modes, drawing
│   ├── js/net.js            online rooms, player sync, voice chat (WebRTC)
│   ├── js/ui.js             screens, selections, room list, results
│   ├── js/audio.js          sound effects and music playback
│   ├── assets/characters/   ch1.png … ch9.png
│   ├── assets/maps/         map1.jpg … map10.jpg
│   ├── assets/weapons/      pistol, shotgun, sniper, rocket, chainsaw, grenade, smoke_*.png
│   ├── assets/items/        medkit, ammo, crate, shield .png
│   ├── assets/effects/      explosion, spark, fire, dust, gold, smoke_*.png
│   ├── sounds/              shot, reload, grenade, explosion, hit, die, medkit .wav
│   └── music/               menu.wav, battle.wav
└── server/                  ← multiplayer server (deploy to Render)
    ├── server.js            rooms, invite codes, player sync, scores, voice signalling
    └── package.json
```

## Run on your computer (test)
1. Install Node.js (https://nodejs.org).
2. Open a terminal in `server/`, then run: `npm install` and `npm start`.
3. Open `client/index.html` with a local web server (for example, the VS Code "Live Server" extension). For online play while testing, set `SERVER_URL` in `client/js/data.js` to `http://localhost:3000`.

## Put the game online (free)
**Step 1 - Server on Render**
1. Push this whole folder to a GitHub repository.
2. On https://render.com, create a **New Web Service** from that repository.
3. Root directory: `server`. Build command: `npm install`. Start command: `npm start`.
4. When it is live, copy the URL, for example `https://doodle-outpost-server.onrender.com`.

**Step 2 - Game on GitHub Pages**
1. In `client/js/data.js`, set `SERVER_URL` to your Render URL.
2. In your repository, go to Settings → Pages, choose the branch, and set the folder to `/client`.
3. Open the Pages link on your phone or PC. Friends open the same link, create or join a room with the 4-letter code, then press START.

## Voice chat
- Microphone works only on HTTPS (GitHub Pages and Render are HTTPS).
- Players press MIC: ON / OFF in the room or on the game screen. Other players hear you when your mic is on.
- Voice uses a direct peer connection between players (WebRTC), so it works best with 2–4 players on normal Wi‑Fi or mobile data.

## Current status
- Working: rooms with invite codes, live player movement, weapons (pistol, shotgun, sniper, rocket, chainsaw), grenades, medkit, shield and health, kill feed, scores, voice chat with mic on/off, offline practice vs one bot, sound effects and music.
- Playable modes: Free For All and Team Deathmatch.
- Next: the other 9 modes (zombies, flag capture, boss fight, battle royale zone, clan wars, 1v1, 2v2, 3v3, 1 vs 6 AI), smoke grenades, ammo box, body box, and map-specific platforms.

## Notes
- Sound effects and music are simple generated placeholders. Replace the files in `client/sounds/` and `client/music/` with your own files, keeping the same names.
- Hits are checked on each player's own device, which is fine for friends. A public server would need server-side checks to stop cheating.

## Tasks and levels (new)
- Each match gives 3 tasks, for example "Get 3 kills with the Pistol" or "Use the jetpack for 5 seconds". Finishing a task gives +100 XP and a new task appears.
- Levels 1 to 10. Level 2 unlocks the Shotgun, 3 the Sniper, 4 the Rocket, 5 the Chainsaw. Each level after 1 adds +5 HP.
- Progress is saved on the device (no account needed). The task panel is on the left of the game screen.
- Task list and XP settings are in `client/js/tasks.js`.
