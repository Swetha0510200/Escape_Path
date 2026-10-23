# THE ESCAPE PATH — The Principal’s Last Trap

A three-level webcam-controlled maze escape game for students. The game runs locally in a browser and uses MediaPipe hand and face tracking.

 https://swetha0510200.github.io/Escape_Path/

## Run the game
1. Extract the ZIP.
2. Open the `escape_path_game` folder.
3. Run `start_game.bat` (or start a local server in this folder, for example `python -m http.server 8000`).
4. Open `http://localhost:8000` in Chrome or Edge.
5. Allow camera access and click Start.

An internet connection is required the first time so the MediaPipe library and tracking models can load. Use a well-lit room and keep your face/hands visible in the camera preview.

## Visual themes
- **Level 1 — Forest Maze:** deep forest-green maze, emerald paths, fireflies, and a friendly ghost mascot.
- **Level 2 — Frozen Maze:** icy blue maze, snowflake details, continuous falling snow, and a penguin mascot.
- **Level 3 — Ancient Mummy Maze:** sandstone and dark-brown maze, golden accents, pyramid silhouettes, drifting desert dust, and a mummy mascot.
The level theme changes automatically when you pass through each exit; the HUD and minimap follow the same palette.

## Controls
- 👍 Thumbs up: move up
- ☝️ Index finger: move right
- ✊ Fist: move down
- Point left: move left
- 🖐️ Open palm: stop

## Level progression and keys
Every level has two treasure chests. Complete the main level challenge and open the first chest to collect the first key. The friendly ghost is only a decorative character/mascot: it does not ask questions and does not award keys. Find the separate 🎮 marker and complete that level’s funny face mini-game. Winning unlocks the second chest; opening it awards the level’s door key. Both keys are required at the level exit.

### Separate funny mini-games for the second chest
- **Level 1 — Blink-O-Meter:** blink 6 times. Close and reopen your eyes for each count.
- **Level 2 — Three-Expression Challenge:** complete one smile, one sad expression, and one angry expression in that order. The game calibrates to a neutral face before scoring.
- **Level 3 — Mummy’s Big Yawn Contest:** open and close your mouth 5 times like a sleepy mummy yawning.

These three mini-games use face tracking, not hand gestures. The counter advances once for each detected close/open or expression cycle. Keep your face in view and avoid covering it. The ghost is separate from these games.

## Main level challenges
- **Forest Maze:** Bonk the Principal by tapping the target with your tracked index fingertip.
- **Frozen Fortress:** dodge the penguin’s flying lunch using your tracked hand.
- **Ancient Ruins:** complete the mummy’s silly face-expression challenge.

After all three levels and all six level keys, complete the final doorbell challenge to earn the Principal’s Master Key and escape.

## Troubleshooting
- If the camera does not start, allow camera access in browser site settings and close other apps using the camera.
- If tracking models do not load, check the internet connection and reload the local game page.
- Use bright, even lighting; keep your face centered for face mini-games and your hand inside the camera frame for movement.

## Automated checks
Run `npm test` in this folder to run the JavaScript syntax, maze connectivity, and browserless progression smoke tests. The automated tests are browserless; the webcam, hand tracking, and face-expression thresholds must also be tried in the target computer/browser because camera quality and lighting vary.


### Latest targeted changes
- Level 2 mini-game tasks are Smile 😊, Sad 😢, and Double Thumbs-Up 👍👍. The third task checks a gentle smile plus both hands positioned beside the cheeks using the existing Face Landmarker and two-hand Hand Landmarker tracking.
- Level 1 Funny Game 1 (blink mini-game) has a 15-second countdown.
- Camera-dependent matching still requires testing with a real webcam; browserless tests cannot verify detection quality or lighting conditions.


## Added character encounters and level music

This update preserves the original funny key mini-games and adds 12 forest ghost, 15 frozen penguin, and 18 ancient mummy encounter points. Each encounter starts a gesture-only sequence challenge; completed encounters disappear from the maze. Each level has a distinct procedural background melody generated with the Web Audio API. Use the existing music button to mute/unmute. Camera permission and localhost are still required for hand tracking.


### Gesture encounter controls and verification
- Each level now places exactly 12 ghost, 15 penguin, and 18 mummy-themed encounter markers on walkable maze tiles. Every marker has its own named activity and task-specific hand-sign pattern.
- During an encounter, show one clear sign and then change/release the sign before presenting the next one; a held camera frame is counted only once. The freeze-style ghost/penguin tests require holding an open palm steadily for five seconds.
- Point the index finger horizontally for LEFT/RIGHT. The camera classifier may label an upright index finger as `INDEX`; encounter handling normalizes that label to the right-pointing sign.
- Background melodies are generated locally with the Web Audio API, so no separate audio files are required. The mute button controls music and sound effects.
- Run `npm test` to check syntax, maze connectivity, encounter counts/placement, and browserless progression. Camera tracking, gesture accuracy, audio playback, and visual effects still need a real Chrome/Edge localhost session with a webcam; these cannot be proven by browserless tests.

## Final responsiveness update (2026-10-23)
- Keeps the three existing levels and their separate forest, frozen-world, and desert soundtracks.
- After reaching a completed level exit, the game shows the `START LEVEL 2` / `START LEVEL 3` transition screen; the next level begins only when that button is selected.
- Improved horizontal index-point classification tolerance and shortened gesture confirmation delay for quicker response.
- Reduced movement repeat speed slightly to make navigation easier to control.
- Successful funny mini-games close their challenge panel automatically and return to the main maze with the reward unlocked.
- Run `start_game.bat` and open `http://localhost:8000` in Chrome. Allow camera access and keep the hand visible in good lighting. Hand tracking uses MediaPipe CDN assets, so internet access is required on first load.

Automated checks: `npm test` passes. Webcam performance still depends on camera quality, lighting, browser, and device; it should be tested on the target computer before presentation.
