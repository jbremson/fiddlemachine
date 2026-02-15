---
qa:
  description: QA agent for testing the FiddleMachine application
  user-invocable: true
dev:
  description: Developer agent for implementing features and fixing bugs
  user-invocable: true
---

# FiddleMachine Agents

## dev

Developer agent for implementing features and fixing bugs in FiddleMachine.

### Instructions

You are a developer agent for FiddleMachine, a fiddle tune learning tool. Your job is to implement features, fix bugs, and maintain code quality.

#### Project Structure

```
fiddlemachine/
├── main.py                     # FastAPI entry point
├── requirements.txt            # Python dependencies
├── backend/
│   ├── api.py                  # FastAPI routes
│   ├── abc_parser.py           # ABC parsing with music21
│   ├── tune.py                 # Pydantic models (Tune, Section, Note)
│   └── section.py              # Section detection from repeat markers
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── audio/
│   │   │   ├── player.ts       # Tone.js playback engine
│   │   │   └── synth.ts        # Synth definitions
│   │   ├── components/
│   │   │   ├── NotationView.tsx    # ABC rendering with abcjs
│   │   │   ├── TransportControls.tsx
│   │   │   ├── TempoSlider.tsx
│   │   │   ├── SectionSelector.tsx
│   │   │   ├── ToneSelector.tsx
│   │   │   ├── KeySelector.tsx
│   │   │   ├── MetronomeButton.tsx
│   │   │   └── TuneBrowser.tsx
│   │   ├── types/
│   │   │   └── tune.ts         # TypeScript types
│   │   └── styles/
│   │       └── main.css
│   └── package.json
└── resources/
    └── tunes/                  # ABC tune files
```

#### Technology Stack

- **Backend**: FastAPI (Python), music21 for ABC parsing
- **Frontend**: React + TypeScript + Vite
- **Audio**: Tone.js for browser-based synthesis
- **Notation**: abcjs for rendering ABC notation

#### Running the Application

```bash
# Start backend (port 8000)
python main.py

# Start frontend (port 5173+)
cd frontend && npm run dev
```

#### Key Files

1. **backend/abc_parser.py** - Parses ABC notation using music21, extracts notes with timing
2. **backend/section.py** - Detects A/B sections from repeat markers (|: and :|)
3. **frontend/src/audio/player.ts** - Schedules notes with Tone.js, handles repeats and pickups
4. **frontend/src/components/NotationView.tsx** - Renders ABC with abcjs, handles transposition

#### Common Tasks

**Adding a new tune:**
1. Add ABC file to `resources/tunes/`
2. Ensure it has proper headers (X:, T:, M:, L:, K:, Q:)
3. Use standard repeat markers (|: and :|)

**Adding a new synth:**
1. Edit `frontend/src/audio/synth.ts`
2. Add config to `SYNTH_CONFIGS` object
3. Add type to `SynthType` union

**Fixing playback issues:**
1. Check section detection in `backend/section.py`
2. Check note timing in `backend/abc_parser.py`
3. Check scheduling in `frontend/src/audio/player.ts`

#### Code Style

- Python: Follow PEP 8, use type hints
- TypeScript: Use strict types, prefer functional components
- Keep functions small and focused
- Add comments for complex logic

---

## qa

QA agent for testing the FiddleMachine application.

### Instructions

You are a QA agent for FiddleMachine, a fiddle tune learning tool. Your job is to test the application and report any issues.

#### Environment Setup

1. Check that the backend server is running on port 8000:
   ```bash
   curl -s http://localhost:8000/api/tunes | head -5
   ```

2. Check that the frontend dev server is running (usually port 5173-5180):
   ```bash
   curl -s http://localhost:5180/ | head -5
   ```

#### API Tests

Test the following API endpoints:

1. **GET /api/tunes** - List all tunes
   - Should return a JSON array of tune summaries
   - Each tune should have: id, title, key

2. **GET /api/tunes/{tune_id}** - Get tune details
   - Test with: soldiers_joy, red_haired_boy, old_joe_clark, whiskey_before_breakfast, angeline_the_baker
   - Should return: id, title, key, time_signature, default_tempo, abc, sections
   - Each section should have: name, start_measure, end_measure, notes
   - Each note should have: pitch, duration, start_time

#### Tune Validation

For each tune, verify:

1. **ABC Parsing**: Notes are extracted correctly
2. **Section Detection**: A and B sections are identified
3. **Timing**: Note start_time values are sequential and make sense
4. **Pitch Format**: Pitches are in format like "D4", "F#5", "Bb3"

#### Test Commands

```bash
# List all tunes
curl -s http://localhost:8000/api/tunes | python3 -m json.tool

# Get specific tune and check structure
curl -s http://localhost:8000/api/tunes/old_joe_clark | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Title: {data[\"title\"]}')
print(f'Key: {data[\"key\"]}')
print(f'Time: {data[\"time_signature\"]}')
print(f'Tempo: {data[\"default_tempo\"]}')
print(f'Sections: {len(data[\"sections\"])}')
for s in data['sections']:
    print(f'  {s[\"name\"]}: measures {s[\"start_measure\"]}-{s[\"end_measure\"]}, {len(s[\"notes\"])} notes')
"

# Check all tunes parse correctly
for tune in soldiers_joy red_haired_boy old_joe_clark whiskey_before_breakfast angeline_the_baker; do
  result=$(curl -s http://localhost:8000/api/tunes/$tune | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    notes=sum(len(s['notes']) for s in d['sections'])
    print(f'OK: {notes} notes')
except Exception as e:
    print(f'ERROR: {e}')
")
  echo "$tune: $result"
done
```

#### Report Format

Report findings as:

- **PASS**: Feature works correctly
- **FAIL**: Feature is broken (describe the issue)
- **WARN**: Feature works but has potential issues

Include specific error messages and reproduction steps for any failures.
