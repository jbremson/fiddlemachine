"""SQLite database for tracking tunes."""

import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Iterator

# Database location
DB_PATH = Path(__file__).parent.parent / "data" / "tunes.db"

MAX_ABC_CONTENT_LENGTH = 50000


class QualityRating(Enum):
    """Quality rating based on highlight risk assessment."""
    HIGH = "high"      # Low risk - highlights should work well
    MEDIUM = "medium"  # Medium risk - may have some issues
    LOW = "low"        # High risk - likely to have highlight problems


@dataclass
class TuneRecord:
    """A tune record from the database."""
    id: int | None
    tune_id: str           # Unique identifier (filename without extension)
    title: str
    source: str            # Where the tune came from (e.g., "local", "thesession.org")
    source_url: str | None # Source URL if applicable
    quality: QualityRating # Highlight quality rating
    rating: float | None   # User rating 0.0-5.0, NULL when rating_count is 0
    rating_count: int      # Number of ratings received
    owner: str | None      # Who owns/submitted this tune
    version: int           # Version number for tracking changes
    abc_content: str       # The ABC notation content
    created_at: datetime
    updated_at: datetime


def get_db_path() -> Path:
    """Get the database path, creating the directory if needed."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return DB_PATH


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Get a database connection with row factory."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def _migrate_schema(conn: sqlite3.Connection) -> None:
    """Detect old schema and migrate if needed."""
    cursor = conn.execute("PRAGMA table_info(tunes)")
    columns = {row['name'] for row in cursor.fetchall()}

    if not columns:
        return  # Table doesn't exist yet

    # Rename url → source_url
    if 'url' in columns and 'source_url' not in columns:
        conn.execute("ALTER TABLE tunes ADD COLUMN source_url TEXT")
        conn.execute("UPDATE tunes SET source_url = url")

    # Add new columns if missing
    if 'rating' not in columns:
        conn.execute("ALTER TABLE tunes ADD COLUMN rating REAL")

    if 'rating_count' not in columns:
        conn.execute("ALTER TABLE tunes ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0")

    if 'owner' not in columns:
        conn.execute("ALTER TABLE tunes ADD COLUMN owner TEXT")

    conn.commit()


def init_db() -> None:
    """Initialize the database schema."""
    with get_connection() as conn:
        # Run migration before creating the table (handles existing DBs)
        _migrate_schema(conn)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS tunes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tune_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'local',
                source_url TEXT,
                quality TEXT NOT NULL DEFAULT 'medium',
                rating REAL,
                rating_count INTEGER NOT NULL DEFAULT 0,
                owner TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                abc_content TEXT NOT NULL CHECK(length(abc_content) <= 50000),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create index on tune_id for fast lookups
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_tunes_tune_id ON tunes(tune_id)
        """)

        # Create index on quality for filtering
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_tunes_quality ON tunes(quality)
        """)

        conn.commit()


def _row_to_record(row: sqlite3.Row) -> TuneRecord:
    """Convert a database row to a TuneRecord."""
    # Handle both old schema (url) and new schema (source_url)
    keys = row.keys()
    source_url = row['source_url'] if 'source_url' in keys else row.get('url')

    return TuneRecord(
        id=row['id'],
        tune_id=row['tune_id'],
        title=row['title'],
        source=row['source'],
        source_url=source_url,
        quality=QualityRating(row['quality']),
        rating=row['rating'] if 'rating' in keys else None,
        rating_count=row['rating_count'] if 'rating_count' in keys else 0,
        owner=row['owner'] if 'owner' in keys else None,
        version=row['version'],
        abc_content=row['abc_content'],
        created_at=datetime.fromisoformat(row['created_at']),
        updated_at=datetime.fromisoformat(row['updated_at'])
    )


def _validate_abc_content(abc_content: str) -> None:
    """Validate ABC content length."""
    if len(abc_content) > MAX_ABC_CONTENT_LENGTH:
        raise ValueError(
            f"ABC content exceeds maximum length of {MAX_ABC_CONTENT_LENGTH} characters "
            f"(got {len(abc_content)})"
        )


def get_versioned_title(title: str) -> str:
    """
    Generate a versioned title if the title already exists.

    If "Soldier's Joy" exists, returns "Soldier's Joy V2".
    If "Soldier's Joy V2" exists, returns "Soldier's Joy V3", etc.
    """
    import re

    with get_connection() as conn:
        # Check if exact title exists
        row = conn.execute("SELECT COUNT(*) as cnt FROM tunes WHERE title = ?", (title,)).fetchone()
        if row['cnt'] == 0:
            return title

        # Extract base title (remove existing version suffix if present)
        match = re.match(r'^(.+?)\s+V(\d+)$', title)
        if match:
            base_title = match.group(1)
        else:
            base_title = title

        # Find all existing versions of this title
        rows = conn.execute(
            "SELECT title FROM tunes WHERE title = ? OR title LIKE ?",
            (base_title, f"{base_title} V%")
        ).fetchall()

        existing_titles = {row['title'] for row in rows}

        # Find the next available version number
        version = 2
        while f"{base_title} V{version}" in existing_titles:
            version += 1

        return f"{base_title} V{version}"


def get_versioned_tune_id(tune_id: str) -> str:
    """
    Generate a versioned tune_id if it already exists.

    If "soldiers_joy" exists, returns "soldiers_joy_v2".
    If "soldiers_joy_v2" exists, returns "soldiers_joy_v3", etc.
    """
    import re

    with get_connection() as conn:
        # Check if exact tune_id exists
        row = conn.execute("SELECT COUNT(*) as cnt FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        if row['cnt'] == 0:
            return tune_id

        # Extract base tune_id (remove existing version suffix if present)
        match = re.match(r'^(.+?)_v(\d+)$', tune_id)
        if match:
            base_id = match.group(1)
        else:
            base_id = tune_id

        # Find all existing versions of this tune_id
        rows = conn.execute(
            "SELECT tune_id FROM tunes WHERE tune_id = ? OR tune_id LIKE ?",
            (base_id, f"{base_id}_v%")
        ).fetchall()

        existing_ids = {row['tune_id'] for row in rows}

        # Find the next available version number
        version = 2
        while f"{base_id}_v{version}" in existing_ids:
            version += 1

        return f"{base_id}_v{version}"


def insert_tune_auto_version(
    tune_id: str,
    title: str,
    abc_content: str,
    source: str = "local",
    source_url: str | None = None,
    quality: QualityRating = QualityRating.MEDIUM,
    owner: str | None = None
) -> TuneRecord:
    """
    Insert a tune, automatically adding version suffix if title/id already exists.

    If a tune with the same title exists, appends " V2", " V3", etc. to the title.
    If a tune with the same tune_id exists, appends "_v2", "_v3", etc. to the tune_id.
    """
    versioned_title = get_versioned_title(title)
    versioned_id = get_versioned_tune_id(tune_id)

    return insert_tune(
        tune_id=versioned_id,
        title=versioned_title,
        abc_content=abc_content,
        source=source,
        source_url=source_url,
        quality=quality,
        owner=owner
    )


def insert_tune(
    tune_id: str,
    title: str,
    abc_content: str,
    source: str = "local",
    source_url: str | None = None,
    quality: QualityRating = QualityRating.MEDIUM,
    version: int = 1,
    owner: str | None = None
) -> TuneRecord:
    """Insert a new tune into the database."""
    _validate_abc_content(abc_content)
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO tunes (tune_id, title, source, source_url, quality, version, abc_content, owner)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (tune_id, title, source, source_url, quality.value, version, abc_content, owner))
        conn.commit()

        row = conn.execute("SELECT * FROM tunes WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return _row_to_record(row)


def update_tune(
    tune_id: str,
    title: str | None = None,
    abc_content: str | None = None,
    source: str | None = None,
    source_url: str | None = None,
    quality: QualityRating | None = None,
    owner: str | None = None,
    increment_version: bool = True
) -> TuneRecord | None:
    """Update an existing tune. Increments version by default."""
    if abc_content is not None:
        _validate_abc_content(abc_content)

    with get_connection() as conn:
        # Get current record
        row = conn.execute("SELECT * FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        if not row:
            return None

        # Build update query
        updates = ["updated_at = CURRENT_TIMESTAMP"]
        params = []

        if title is not None:
            updates.append("title = ?")
            params.append(title)
        if abc_content is not None:
            updates.append("abc_content = ?")
            params.append(abc_content)
        if source is not None:
            updates.append("source = ?")
            params.append(source)
        if source_url is not None:
            updates.append("source_url = ?")
            params.append(source_url)
        if quality is not None:
            updates.append("quality = ?")
            params.append(quality.value)
        if owner is not None:
            updates.append("owner = ?")
            params.append(owner)
        if increment_version:
            updates.append("version = version + 1")

        params.append(tune_id)

        conn.execute(f"""
            UPDATE tunes SET {', '.join(updates)} WHERE tune_id = ?
        """, params)
        conn.commit()

        row = conn.execute("SELECT * FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        return _row_to_record(row)


def get_tune(tune_id: str) -> TuneRecord | None:
    """Get a tune by its tune_id."""
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        return _row_to_record(row) if row else None


def get_all_tunes() -> list[TuneRecord]:
    """Get all tunes from the database."""
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM tunes ORDER BY title").fetchall()
        return [_row_to_record(row) for row in rows]


def get_tunes_by_quality(quality: QualityRating) -> list[TuneRecord]:
    """Get all tunes with a specific quality rating."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM tunes WHERE quality = ? ORDER BY title",
            (quality.value,)
        ).fetchall()
        return [_row_to_record(row) for row in rows]


def delete_tune(tune_id: str) -> bool:
    """Delete a tune by its tune_id. Returns True if deleted."""
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM tunes WHERE tune_id = ?", (tune_id,))
        conn.commit()
        return cursor.rowcount > 0


def upsert_tune(
    tune_id: str,
    title: str,
    abc_content: str,
    source: str = "local",
    source_url: str | None = None,
    quality: QualityRating = QualityRating.MEDIUM,
    owner: str | None = None
) -> TuneRecord:
    """Insert or update a tune. If it exists, increments version."""
    existing = get_tune(tune_id)
    if existing:
        return update_tune(
            tune_id,
            title=title,
            abc_content=abc_content,
            source=source,
            source_url=source_url,
            quality=quality,
            owner=owner
        )
    else:
        return insert_tune(tune_id, title, abc_content, source, source_url, quality, owner=owner)


def add_rating(tune_id: str, value: float) -> TuneRecord | None:
    """Add a user rating for a tune. Computes running average."""
    if not 0.0 <= value <= 5.0:
        raise ValueError("Rating must be between 0.0 and 5.0")

    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        if not row:
            return None

        current_rating = row['rating']
        current_count = row['rating_count']

        new_count = current_count + 1
        if current_rating is None:
            new_rating = value
        else:
            new_rating = (current_rating * current_count + value) / new_count

        conn.execute("""
            UPDATE tunes SET rating = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE tune_id = ?
        """, (new_rating, new_count, tune_id))
        conn.commit()

        row = conn.execute("SELECT * FROM tunes WHERE tune_id = ?", (tune_id,)).fetchone()
        return _row_to_record(row)


def sync_from_files(tunes_dir: Path | None = None) -> dict[str, str]:
    """
    Sync database from ABC files in the tunes directory.
    This is a one-time import tool for seeding the database from filesystem tunes.
    Returns a dict of {tune_id: action} where action is 'inserted', 'updated', or 'unchanged'.
    """
    from .abc_parser import parse_abc_file
    from .highlight_risk import assess_abc_file, RiskLevel

    if tunes_dir is None:
        tunes_dir = Path(__file__).parent.parent / "resources" / "tunes"

    init_db()
    results = {}

    for abc_file in sorted(tunes_dir.glob("*.abc")):
        tune_id = abc_file.stem

        with open(abc_file, 'r') as f:
            abc_content = f.read()

        # Parse to get title
        try:
            tune = parse_abc_file(str(abc_file))
            title = tune.title
        except Exception:
            # Fallback: extract title from ABC
            import re
            match = re.search(r'^T:\s*(.+)$', abc_content, re.MULTILINE)
            title = match.group(1).strip() if match else tune_id

        # Assess quality using highlight risk
        try:
            assessment = assess_abc_file(str(abc_file))
            # Map risk levels to quality (inverted - high risk = low quality)
            quality_map = {
                RiskLevel.LOW: QualityRating.HIGH,
                RiskLevel.MEDIUM: QualityRating.MEDIUM,
                RiskLevel.HIGH: QualityRating.LOW,
            }
            quality = quality_map[assessment.overall_risk]
        except Exception:
            quality = QualityRating.MEDIUM

        # Check if tune exists and content changed
        existing = get_tune(tune_id)
        if existing:
            if existing.abc_content == abc_content:
                results[tune_id] = 'unchanged'
            else:
                update_tune(tune_id, title=title, abc_content=abc_content, quality=quality)
                results[tune_id] = 'updated'
        else:
            insert_tune(tune_id, title, abc_content, source="local", quality=quality)
            results[tune_id] = 'inserted'

    return results


def print_tunes_table() -> None:
    """Print all tunes in a formatted table."""
    tunes = get_all_tunes()

    if not tunes:
        print("No tunes in database.")
        return

    # Column widths
    id_w = max(len(t.tune_id) for t in tunes)
    title_w = max(len(t.title) for t in tunes)
    source_w = max(len(t.source) for t in tunes)

    # Header
    print(f"\n{'ID':<{id_w}}  {'Title':<{title_w}}  {'Source':<{source_w}}  Quality  Ver  Rating     URL")
    print("-" * (id_w + title_w + source_w + 50))

    # Rows
    for t in tunes:
        quality_colors = {
            QualityRating.HIGH: '\033[92m',    # Green
            QualityRating.MEDIUM: '\033[93m',  # Yellow
            QualityRating.LOW: '\033[91m',     # Red
        }
        reset = '\033[0m'
        color = quality_colors[t.quality]
        url = t.source_url or '-'
        rating_str = f"{t.rating:.1f}({t.rating_count})" if t.rating is not None else "-"
        print(f"{t.tune_id:<{id_w}}  {t.title:<{title_w}}  {t.source:<{source_w}}  "
              f"{color}{t.quality.value:6}{reset}   {t.version:3}  {rating_str:9}  {url}")


# CLI interface
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Manage the tunes database')
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # init command
    subparsers.add_parser('init', help='Initialize the database')

    # sync command
    sync_parser = subparsers.add_parser('sync', help='Sync database from ABC files (one-time import)')
    sync_parser.add_argument('--dir', help='Tunes directory (default: resources/tunes)')

    # list command
    subparsers.add_parser('list', help='List all tunes')

    # show command
    show_parser = subparsers.add_parser('show', help='Show a specific tune')
    show_parser.add_argument('tune_id', help='Tune ID to show')

    # update command
    update_parser = subparsers.add_parser('update', help='Update tune metadata')
    update_parser.add_argument('tune_id', help='Tune ID to update')
    update_parser.add_argument('--source', help='Source (e.g., "thesession.org", "local")')
    update_parser.add_argument('--source-url', help='Source URL')
    update_parser.add_argument('--quality', choices=['high', 'medium', 'low'],
                               help='Highlight quality rating')
    update_parser.add_argument('--owner', help='Owner/submitter of the tune')

    args = parser.parse_args()

    if args.command == 'init':
        init_db()
        print(f"Database initialized at {get_db_path()}")

    elif args.command == 'sync':
        tunes_dir = Path(args.dir) if args.dir else None
        results = sync_from_files(tunes_dir)
        print(f"\nSync complete:")
        for action in ['inserted', 'updated', 'unchanged']:
            count = sum(1 for r in results.values() if r == action)
            if count > 0:
                print(f"  {action}: {count}")
        print_tunes_table()

    elif args.command == 'list':
        init_db()
        print_tunes_table()

    elif args.command == 'show':
        init_db()
        tune = get_tune(args.tune_id)
        if tune:
            print(f"\nTune: {tune.title}")
            print(f"  ID: {tune.tune_id}")
            print(f"  Source: {tune.source}")
            print(f"  URL: {tune.source_url or 'N/A'}")
            print(f"  Quality: {tune.quality.value}")
            rating_str = f"{tune.rating:.1f} ({tune.rating_count} ratings)" if tune.rating is not None else "No ratings"
            print(f"  Rating: {rating_str}")
            print(f"  Owner: {tune.owner or 'N/A'}")
            print(f"  Version: {tune.version}")
            print(f"  Created: {tune.created_at}")
            print(f"  Updated: {tune.updated_at}")
            print(f"\nABC Content:\n{tune.abc_content}")
        else:
            print(f"Tune '{args.tune_id}' not found")

    elif args.command == 'update':
        init_db()
        quality = QualityRating(args.quality) if args.quality else None
        result = update_tune(
            args.tune_id,
            source=args.source,
            source_url=getattr(args, 'source_url', None),
            quality=quality,
            owner=args.owner,
            increment_version=False
        )
        if result:
            print(f"Updated {args.tune_id}")
            print(f"  Source: {result.source}")
            print(f"  URL: {result.source_url or 'N/A'}")
            print(f"  Quality: {result.quality.value}")
            print(f"  Owner: {result.owner or 'N/A'}")
        else:
            print(f"Tune '{args.tune_id}' not found")

    else:
        parser.print_help()
