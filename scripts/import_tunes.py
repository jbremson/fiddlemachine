"""Import popular tunes from thesession.org into fiddlemachine."""
import json
import re
import ssl
import subprocess
import time
import urllib.request

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

STAGING_URL = "https://staging.fiddlemachine.com"

TYPE_TO_METER = {
    "reel": "4/4",
    "jig": "6/8",
    "slip jig": "9/8",
    "hornpipe": "4/4",
    "polka": "2/4",
    "slide": "12/8",
    "waltz": "3/4",
    "march": "4/4",
    "barndance": "4/4",
    "strathspey": "4/4",
    "three-two": "3/2",
    "mazurka": "3/4",
}

KEY_MAP = {
    "Amajor": "A", "Aminor": "Am", "Adorian": "ADor", "Amixolydian": "AMix",
    "Bmajor": "B", "Bminor": "Bm", "Bdorian": "BDor", "Bmixolydian": "BMix",
    "Cmajor": "C", "Cminor": "Cm", "Cdorian": "CDor", "Cmixolydian": "CMix",
    "Dmajor": "D", "Dminor": "Dm", "Ddorian": "DDor", "Dmixolydian": "DMix",
    "Emajor": "E", "Eminor": "Em", "Edorian": "EDor", "Emixolydian": "EMix",
    "Fmajor": "F", "Fminor": "Fm", "Fdorian": "FDor", "Fmixolydian": "FMix",
    "Gmajor": "G", "Gminor": "Gm", "Gdorian": "GDor", "Gmixolydian": "GMix",
}

TUNE_IDS = [
    # Reels
    27, 1, 182, 64, 8, 116, 248, 73, 42, 98, 68, 103, 74, 197, 20, 72, 208,
    113, 2, 69, 75, 118, 221, 517, 589, 141, 511, 21, 33, 462, 560, 543, 518,
    222, 86, 114, 399, 87, 430, 18, 115, 570, 791, 726, 188, 105, 99, 219, 602,
    440, 2549, 756, 363, 410, 44, 891, 11, 471, 496, 112, 36, 236, 120, 24,
    249, 629, 812, 477, 718, 77, 58, 240, 166, 828, 321, 579, 1552, 733, 424,
    408, 696, 302, 556, 637, 138,
    # Jigs
    55, 71, 9, 108, 19, 106, 5, 60, 62, 12, 15, 111, 92, 76, 702, 256, 67,
    793, 29, 582, 88, 307, 381, 107, 447, 544, 35, 43, 26, 89, 56, 45, 109,
    829, 139, 210, 308, 84, 151, 160, 448, 476, 335, 81, 91, 667, 382, 1076,
    299, 467, 775, 17, 273, 358, 271, 1359, 134, 261, 34, 1080, 228, 397, 332,
    728, 101, 1638, 808, 351, 948, 206, 771, 61, 264, 37, 398, 820, 217, 1077,
    319, 333, 232, 537, 843, 389, 870, 736, 888, 401, 324, 1497,
    # Hornpipes
    83, 475, 49, 651, 30, 566, 13, 310, 1356, 478, 872, 82, 980, 38, 869, 4,
    652, 1104, 1500, 663, 553, 841, 974, 996, 666, 223, 309, 337, 785,
    # Slip jigs
    10, 52, 750, 593, 482, 879, 48, 104, 388, 612, 93, 46, 635, 1340, 378,
    148, 661, 527, 28,
    # Polkas
    441, 1075, 39, 238, 291, 357, 85, 481, 239, 583, 466, 604, 786, 679, 265,
    # Waltzes/Airs
    449, 211, 454, 957, 601, 562, 790, 1292, 1055, 986, 2575, 991, 997, 1559,
    858, 1815, 1126,
    # Slides
    250, 70, 53, 1398, 159, 23, 455, 1414, 325, 185,
    # Marches
    7, 1308, 706, 1441, 638, 851, 1382, 2080, 660, 1083,
]


def fetch_tune_json(tune_id):
    url = f"https://thesession.org/tunes/{tune_id}?format=json"
    req = urllib.request.Request(url, headers={"User-Agent": "FiddleMachine/1.0"})
    with urllib.request.urlopen(req, timeout=10, context=SSL_CTX) as resp:
        return json.loads(resp.read())


def make_tune_id(name):
    """Convert tune name to a slug-style tune_id."""
    slug = name.lower().strip()
    slug = re.sub(r"[''']", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    slug = slug.strip("_")
    return slug


def build_abc(data):
    """Build ABC string from thesession.org JSON data."""
    name = data["name"]
    tune_type = data["type"]
    settings = data["settings"]

    best = max(settings, key=lambda s: s.get("tunebooks", 0))
    key = KEY_MAP.get(best["key"], best["key"])
    meter = TYPE_TO_METER.get(tune_type, "4/4")
    abc_body = best["abc"].replace("!", "\n")

    return f"X:1\nT:{name}\nM:{meter}\nK:{key}\n{abc_body}\n"


def import_tune(tune_id):
    """Import a single tune from thesession.org."""
    data = fetch_tune_json(tune_id)
    name = data["name"]
    abc = build_abc(data)
    tid = make_tune_id(name)
    source_url = f"https://thesession.org/tunes/{tune_id}"

    payload = json.dumps({
        "tune_id": tid,
        "title": name,
        "abc_content": abc,
        "source": "thesession.org",
        "source_url": source_url,
        "auto_version": True,
    })

    result = subprocess.run(
        ["curl", "-s", "-w", "\n%{http_code}", "-X", "POST",
         f"{STAGING_URL}/api/tunes",
         "-H", "Content-Type: application/json",
         "-d", payload],
        capture_output=True, text=True, timeout=30,
    )
    lines = result.stdout.rsplit("\n", 1)
    body = lines[0] if len(lines) > 1 else result.stdout
    code = int(lines[1]) if len(lines) > 1 else 0

    if 200 <= code < 300:
        return "ok", name
    else:
        return "error", f"{name}: {code} {body[:200]}"


def main():
    success = 0
    errors = 0
    for i, tune_id in enumerate(TUNE_IDS):
        try:
            status, msg = import_tune(tune_id)
            if status == "ok":
                success += 1
                print(f"[{i+1}/{len(TUNE_IDS)}] OK: {msg}")
            else:
                errors += 1
                print(f"[{i+1}/{len(TUNE_IDS)}] ERR: {msg}")
        except Exception as e:
            errors += 1
            print(f"[{i+1}/{len(TUNE_IDS)}] ERR: tune {tune_id}: {e}")
        time.sleep(0.5)

    print(f"\nDone: {success} imported, {errors} errors")


if __name__ == "__main__":
    main()
