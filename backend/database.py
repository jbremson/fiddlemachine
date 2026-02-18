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
    url: str | None        # Source URL if applicable
    quality: QualityRating # Highlight quality rating
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


def init_db() -> None:
    """Initialize the database schema."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tunes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tune_id TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'local',
                url TEXT,
                quality TEXT NOT NULL DEFAULT 'medium',
                version INTEGER NOT NULL DEFAULT 1,
                abc_content TEXT NOT NULL,
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
    return TuneRecord(
        id=row['id'],
        tune_id=row['tune_id'],
        title=row['title'],
        source=row['source'],
        url=row['url'],
        quality=QualityRating(row['quality']),
        version=row['version'],
        abc_content=row['abc_content'],
        created_at=datetime.fromisoformat(row['created_at']),
        updated_at=datetime.fromisoformat(row['updated_at'])
    )


def insert_tune(
    tune_id: str,
    title: str,
    abc_content: str,
    source: str = "local",
    url: str | None = None,
    quality: QualityRating = QualityRating.MEDIUM,
    version: int = 1
) -> TuneRecord:
    """Insert a new tune into the database."""
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO tunes (tune_id, title, source, url, quality, version, abc_content)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (tune_id, title, source, url, quality.value, version, abc_content))
        conn.commit()

        row = conn.execute("SELECT * FROM tunes WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return _row_to_record(row)


def update_tune(
    tune_id: str,
    title: str | None = None,
    abc_content: str | None = None,
    source: str | None = None,
    url: str | None = None,
    quality: QualityRating | None = None,
    increment_version: bool = True
) -> TuneRecord | None:
    """Update an existing tune. Increments version by default."""
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
        if url is not None:
            updates.append("url = ?")
            params.append(url)
        if quality is not None:
            updates.append("quality = ?")
            params.append(quality.value)
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
    url: str | None = None,
    quality: QualityRating = QualityRating.MEDIUM
) -> TuneRecord:
    """Insert or update a tune. If it exists, increments version."""
    existing = get_tune(tune_id)
    if existing:
        return update_tune(
            tune_id,
            title=title,
            abc_content=abc_content,
            source=source,
            url=url,
            quality=quality
        )
    else:
        return insert_tune(tune_id, title, abc_content, source, url, quality)


def sync_from_files(tunes_dir: Path | None = None) -> dict[str, str]:
    """
    Sync database from ABC files in the tunes directory.
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
    print(f"\n{'ID':<{id_w}}  {'Title':<{title_w}}  {'Source':<{source_w}}  Quality  Ver  URL")
    print("-" * (id_w + title_w + source_w + 30))

    # Rows
    for t in tunes:
        quality_colors = {
            QualityRating.HIGH: '\033[92m',    # Green
            QualityRating.MEDIUM: '\033[93m',  # Yellow
            QualityRating.LOW: '\033[91m',     # Red
        }
        reset = '\033[0m'
        color = quality_colors[t.quality]
        url = t.url or '-'
        print(f"{t.tune_id:<{id_w}}  {t.title:<{title_w}}  {t.source:<{source_w}}  "
              f"{color}{t.quality.value:6}{reset}   {t.version:3}  {url}")


# CLI interface
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Manage the tunes database')
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # init command
    subparsers.add_parser('init', help='Initialize the database')

    # sync command
    sync_parser = subparsers.add_parser('sync', help='Sync database from ABC files')
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
    update_parser.add_argument('--url', help='Source URL')
    update_parser.add_argument('--quality', choices=['high', 'medium', 'low'],
                               help='Highlight quality rating')

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
            print(f"  URL: {tune.url or 'N/A'}")
            print(f"  Quality: {tune.quality.value}")
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
            url=args.url,
            quality=quality,
            increment_version=False
        )
        if result:
            print(f"Updated {args.tune_id}")
            print(f"  Source: {result.source}")
            print(f"  URL: {result.url or 'N/A'}")
            print(f"  Quality: {result.quality.value}")
        else:
            print(f"Tune '{args.tune_id}' not found")

    else:
        parser.print_help()
