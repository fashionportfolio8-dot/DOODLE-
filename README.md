# Doodle Outpost - Multiplayer Prototype

2D side-view multiplayer shooter (landscape). Works on phone and PC.

## Folder structure
```
DOODLE--main/
├── docs/                    ← the game (GitHub Pages serves this folder)
│   ├── index.html           screens, HUD, room, touch controls
│   ├── sw.js                offline cache (bump CACHE name on every release)
│   ├── manifest.json
│   ├── css/style.css
│   ├── js/data.js           SERVER_URL, GAME_VERSION, characters, maps, modes, weapons
│   ├── js/game.js           fixed-step simulation, weapons, explosions, pickups, drawing
│   ├── js/net.js            socket connection, rooms, player sync, voice chat (WebRTC)
│   ├── js/ui.js             screens, selections, room list, results
│   ├── js/tasks.js          tasks, XP, levels (saved on this device)
│   ├── js/zombie.js         Zombie Survival (offline only)
│   ├── js/mission-ui.js     mission briefing and task drawer
│   ├── js/hud-controls.js   touch controls
│   ├── js/audio.js          sound effects and music
│   ├── assets/              characters, maps, weapons, items, effects, zombies, icons
│   ├── sounds/ and music/
└── server/                  ← multiplayer server (deploy to Render)
    ├── server.js            rooms, invite codes, player sync, scores, voice signalling
    └── package.json
```

## Run on your computer (test)
1. Install Node.js (https://nodejs.org).
2. Open a terminal in `server/`, then run: `npm install` and `npm start`.
3. Open `docs/index.html` with a local web server (for example, the VS Code "Live Server" extension). For online play while testing, set `SERVER_URL` in `docs/js/data.js` to `http://localhost:3000`.

## Put the game online (free)
**Step 1 - Server on Render**
1. Push this whole folder to a GitHub repository.
2. On https://render.com, create a **New Web Service** from that repository.
3. Root directory: `server`. Build command: `npm install`. Start command: `npm start`.
4. When it is live, copy the URL, for example `https://doodle-outpost-server.onrender.com`.

**Step 2 - Game on GitHub Pages**
1. In `docs/js/data.js`, set `SERVER_URL` to your Render URL.
2. In your repository, go to Settings → Pages, choose the branch, and set the folder to `/docs`.
3. Open the Pages link on your phone or PC. Friends open the same link, create or join a room with the 4-letter code, then press START.

## Voice chat
- Microphone works only on HTTPS (GitHub Pages and Render are HTTPS).
- Players press MIC: ON / OFF in the room or on the game screen. Other players hear you when your mic is on.
- Voice uses a direct peer connection between players (WebRTC), so it works best with 2–4 players on normal Wi‑Fi or mobile data.

## Current status
- Working: rooms with invite codes, live player movement, weapons (pistol, shotgun, sniper, rocket, chainsaw), grenades, medkit, shield and health, kill feed, scores, voice chat with mic on/off, offline practice vs one bot, sound effects and music.
- Playable modes: Free For All and Team Deathmatch; Zombie Survival is solo offline. Online 1 vs 1, 2 vs 2 and 3 vs 3 use server-enforced player counts.
- Still planned: Capture the Flag, Boss Battle, Battle Royale, Clan Wars and 1 vs 6 AI, plus online zombie co-op, smoke grenades, ammo box, body box and map-specific platforms.

## Notes
- Sound effects and music are simple generated placeholders. Replace the files in `docs/sounds/` and `docs/music/` with your own files, keeping the same names.
- Hits are checked on each player's own device, which is fine for friends. A public server would need server-side checks to stop cheating.

## Tasks and levels (new)
- Each match gives 3 tasks, for example "Get 3 kills with the Pistol" or "Use the jetpack for 5 seconds". Finishing a task gives +100 XP and a new task appears.
- Levels 1 to 10. Level 2 unlocks the Shotgun, 3 the Sniper, 4 the Rocket, 5 the Chainsaw. Each level after 1 adds +5 HP.
- Progress is saved on the device (no account needed). The task panel is on the left of the game screen.
- Task list and XP settings are in `docs/js/tasks.js`.

## Changelog v1.0.6 (fixes)
- **Game froze after a death.** `centerText()` was called but never defined, so the render loop stopped. It is now defined, and a render error can no longer stop the loop.
- **Physics depended on the screen refresh rate** (2x speed on 120 Hz, half speed on 30 Hz). The simulation now runs at a fixed 60 steps per second.
- **Server could crash** on malformed events. Every handler is guarded and inputs are validated. Callsigns are sanitised and modes are checked.
- **Callsigns were inserted into the page as HTML** (XSS). They are now escaped everywhere.
- **Match start used the server clock** compared against each device's clock. Matches now start after a relative delay from the server.
- **Rocket explosions could damage a player twice.** Each shot has an id, and damage is applied once per id.
- **Death drops could not be collected online.** They are now shared like other pickups.
- **Leaving a room did not tell the server**, which left ghost players in the room. Leave and Back now leave the room.
- **Practice mode used "Commander" and the default character** after an online connection. It now uses the selected name and character.
- **Opening the Armory before any match threw an error.** It now works.
- **Task XP was lost** when a match was left early. Progress is now saved as XP is earned.
- **Results matched players by name**, which broke when two players had the same name. They are matched by id now.
- Service worker now caches `zombie.js` and is at `doodle-outpost-v10`.

## Known limits (next steps)
- Hits are still checked on each player's device. A public server needs server-side hit validation and rate limits.
- Character perks shown in the Armory are not implemented yet.
- Zombie Survival is local only. It is not synced in online rooms.
- Voice uses STUN only. Some mobile and corporate networks will need a TURN server.
- The HUD and mission styles are injected by three stacked `<style>` blocks in `mission-ui.js`. Merge them into `style.css`.
