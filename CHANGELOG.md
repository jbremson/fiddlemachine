# Changelog

## v2.2.0 — 2026-06-13

- Allow anonymous ABC URL fetch (no login required)
- Add activity logging with admin Activity Log tab and logs endpoint
- Add SoundFont engine with MIDI-based playback
- Use mp3 files with flat note names for SoundFont
- Fix MIDI playback to use actual note bounds instead of custom section bounds
- Add modern neutral aesthetic with Inter font and sticky headers

## v2.1.0 — 2026-04-12

- Add practice stats with play tracking, summary, and history
- Add bulk tune import from thesession.org

## v2.0.1 — 2026-03-07

- Bump version to 2.0.1

## v2.0.0 — 2026-03-01

- Fix pickup detection after `:|` when no following `|:`
- Fix missing non-repeating section after repeat markers
- Add Midnight On The Water waltz to database
- Fix key transposition to use minimal accidentals
- Fix key signature transposition using conventional key names
- Fix 'Key of undefined' in transpose menu
- Add local development start script
- Replace fixed countoff with calculated pickup lead-in

## v1.2.0 — 2026-02-23

- Add Midnight On The Water waltz
- Add community feedback from Fiddle Hangout to TODOs
- Add tune list caching to avoid repeated SQL queries
- Fix section boundary detection for tunes with and without pickups
- Add Debug link to view stored ABC and expanded playback notes
- Hide tune count when library is empty
- Include tunes database in deployment
- Remove unused beatsPerMeasure variable
- Fix playback repeat expansion and section boundary detection
- Add tune versioning, player menu, and tune info popup
- Add golden brown theme, menu system, and 181 traditional tunes
- Move ABC tunes from filesystem to database as sole source of truth

## v1.1.0 — 2026-02-20

- Improve Edit ABC UX: auto-scroll and move Reload button to lower right
- Fix zoom button order: minus on left, plus on right
- Add print button, reverse zoom controls, and scrollable notation

## v1.0.0 — 2026-02-19

- Add Edit ABC feature and fix pickup detection heuristic
- Fix Railway start command shell variable expansion
- Enable access logging on Railway
- Fix pickup detection for separate repeat markers and update tunes
- Fix section boundary detection for pickup notes after `:|:`
- Remove highlight tracking feature
- Add URL/ABC loaders, searchable library, about popup, and UI improvements
- Keep user BPM setting when loading tunes
- Change initial default tempo to 72 BPM
- Fix count-off timing and ensure transport position reset
- Update count-off button with conductor baton icon
- Add count-off feature with configurable clicks
- Add 5 popular Celtic tunes
- Remove copyrighted tunes
- Restructure app with tune list entry page
- Increase BPM limit to 30-200 range

## v0.2.0 — 2026-02-18

- Add tests, Google Analytics, and redesign controls UI
- Add aria-labels for accessibility and remove unused CSS
- Redesign controls UI and fix accessibility issues

## v0.1.0 — 2026-02-17

- Add Railway deployment configuration
- Add database, highlight risk tool, and fix section parsing
- Add new tunes, zoom control, and repeat selector

## v0.0.1 — 2026-02-14

- Initial commit: FiddleMachine fiddle tune learning tool
- Add bar highlighting with beat-aware timing and Tennessee Waltz
- Replace bar highlighting with note-level highlighting
- Add octave control, tempo input, highlight offset, and fix section parsing
- Use V3 highlighting approach and remove test versions
