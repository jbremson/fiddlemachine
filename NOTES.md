# FiddleMachine Development Notes

Development notes and learnings for the FiddleMachine fiddle tune learning app.

---

## Community & Feedback

### 2026-02-20 - Community Post on Mandolin Cafe Forum
Posted about FiddleMachine on Mandolin Cafe forum to get community feedback on the app.
- URL: https://www.mandolincafe.net/home/forum/song-and-tune-projects/song-and-tune-projects-aa/3429166-fiddle-machine-abc-player-alpha
- Purpose: Gather user feedback and feature requests from experienced mandolinists and fiddle players
- Files: External community forum post

### 2026-02-20 - Community Post on Fiddle Hangout
Posted about FiddleMachine on Fiddle Hangout forum to get community feedback on the app.
- URL: https://www.fiddlehangout.com/topic/60650
- Purpose: Gather user feedback and feature requests from experienced fiddlers
- Files: External community forum post

---

## Architecture

### 2026-02-14 - Note Highlighting Approaches
Three versions of note highlighting were implemented to compare approaches:
- **V1 (Timeline-based)**: Builds flat timeline of all notes including repeats, highlights by index lookup
- **V2 (Direct ratio)**: Maps progress directly to note index using ratio calculation
- **V3 (Beat-accurate)**: Uses actual beat positions from note timing data (start_time, duration)
- Files: `frontend/src/components/NotationViewV1.tsx`, `NotationViewV2.tsx`, `NotationViewV3.tsx`

---

## UX / Controls

### 2026-02-14 - Real-time Control Constraints
Consider which controls can be changed during playback vs. which require stopping first:
- **Safe during playback**: Tempo, metronome toggle, possibly transpose (if synth supports it)
- **May need stop first**: Section mode changes, tune selection, key changes that require re-rendering notation
- **Design consideration**: Either disable unavailable controls during playback, or auto-stop when user changes them

---

## Audio

---

## Notation

### 2026-02-14 - abcjs Note Elements
The abcjs library renders ABC notation to SVG. Notes get the `.abcjs-note` CSS class which can be queried and manipulated for highlighting.
- Use `svg.querySelectorAll('.abcjs-note')` to get all note elements
- Add/remove `.abcjs-note-playing` class for highlight effect
- Note elements are in visual order (left to right, top to bottom)
- Files: `frontend/src/components/NotationViewV3.tsx:159`

### 2026-02-14 - Pickup Bars (Anacrusis)
Tunes like "Angeline the Baker" have partial pickup bars at the start. The ending bar completes the partial bar.
- Pickup notes count toward total but timing needs adjustment
- Simplified approach: just highlight notes without worrying about pickup/ending bar alignment
- Files: See NotationView versions

---

## Backend

---

## Debugging

---

## Patterns

### 2026-02-14 - Section Repeats (AABB Form)
Each section plays twice in traditional tune format. When calculating note indices during playback:
- Track `noteOffset` to map playback position back to visual note index
- `noteIdx = noteOffset + (noteInSection % sectionNotes.length)`
- Files: `frontend/src/components/NotationViewV2.tsx:136-154`

---

## Gotchas

### 2026-02-14 - TypeScript Unused Variables
TypeScript strict mode (noEmit) catches unused variables. When refactoring, ensure all references are removed.
- Example: Removing `setTotalNotes` state but leaving call in useEffect caused error

---

## Project TODOs

### 2026-02-23 - Community Feedback (Fiddle Hangout)
User feedback received - positive reception, "this is a useful tool". Two suggestions:

1. **Highlight the current playing note** - Visual feedback showing which note is currently being played during playback.

2. **Clarify the BPM setting** - "Beat" is ambiguous (Irish reel and jig is 2 beats per bar). Suggestions:
   - Bars per minute
   - Quarter notes per minute
   - Dotted-quarter notes per minute (for waltzes)
   - Note: User also liked the "funky BPM increments" (117, 122, 127, etc. - almost prime numbers)

### 2026-02-15 - Future Features
- Settings screen
- Interface beautification
- Users (authentication/accounts)
- Importing songs (user-uploaded ABC files)
- About screen

### 2026-02-15 - ABC File Import Feature
Allow users to import their own ABC files to use in the app.
- **UI**: Add "Import ABC" button in tune browser or header
- **Frontend**: File picker accepting `.abc` files, read file contents
- **API**: `POST /api/tunes/parse` endpoint already planned (see plan file)
- **Validation**: Parse ABC on backend, return errors if invalid
- **Storage options**:
  - Session-only (lost on refresh) - simplest MVP
  - LocalStorage (persists in browser) - no backend changes
  - User accounts (persists on server) - requires auth system
- **Considerations**:
  - Handle multi-tune ABC files (X:1, X:2, etc.)
  - Detect/validate time signature and key
  - Section detection for A/B parts

### 2026-02-26 - URL Deep Link Feature
Allow external websites to link directly to a tune in FiddleMachine by encoding ABC in the URL.
- **Use case**: Tune website embeds a "Play in FiddleMachine" link that opens the tune directly
- **URL format options**:
  - Query param with base64-encoded ABC: `fiddlemachine.com/?abc=<base64>`
  - Hash-based: `fiddlemachine.com/#abc=<base64>`
- **Frontend**: On load, check URL for `abc` param, decode and load tune
- **Considerations**:
  - URL length limits (~2000 chars safe) - base64 expands by ~33%
  - May need URL-safe base64 encoding
  - Could also support `?url=<abc-file-url>` to fetch ABC from external URL (CORS considerations)

### 2026-02-26 - User Accounts Feature

**Authentication options:**
1. **OAuth only (Google, GitHub)** - No passwords to manage, no email verification needed, simplest and most secure
2. **Email/password** - Requires email verification, password hashing (bcrypt), reset flow
3. **Magic link** - Email a login link, no passwords, but requires email sending infrastructure

**Recommendation:** Start with OAuth (Google) - no verification complexity, Railway doesn't provide email services.

**Email verification on Railway:**
- Railway doesn't include email services
- Would need external service: SendGrid, Mailgun, Resend, AWS SES
- Adds complexity and cost
- OAuth sidesteps this entirely

**Security for user-submitted ABC files:**
- **Input validation**: Max file size (e.g., 50KB - plenty for any tune)
- **Sanitization**: ABC is plain text, but sanitize before storing (strip null bytes, control chars)
- **Rate limiting**: Limit uploads per user per hour to prevent abuse
- **Content limits**: Max notes per tune, max sections
- **No executable content**: ABC has no code execution risk, but validate it parses successfully
- **SQL injection**: Use parameterized queries (SQLAlchemy/Pydantic handle this)
- **Storage quotas**: Limit tunes per user (e.g., 100 tunes)

**SQLite limits and scaling:**
- **File size**: SQLite handles databases up to 281 TB theoretically, ~1GB practical for good performance
- **Concurrent writes**: Single writer at a time - fine for low-moderate traffic
- **Railway volume**: Persistent volumes available, but single-instance only
- **Estimate**: 1000 users × 50 tunes × 5KB = 250MB - SQLite handles easily
- **When to migrate**: If you hit >100 concurrent users or need multi-instance, move to PostgreSQL (Railway offers managed Postgres)

**Schema additions:**
```sql
users (id, email, name, oauth_provider, oauth_id, created_at)
user_tunes (id, user_id, title, abc_content, created_at, updated_at)
```

**MVP approach:**
1. Google OAuth via `authlib` or `python-social-auth`
2. JWT tokens for session management
3. User tunes stored in SQLite with foreign key to users
4. Rate limit: 10 tune uploads per hour
5. Size limit: 50KB per ABC file, 100 tunes per user
