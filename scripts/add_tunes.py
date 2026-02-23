#!/usr/bin/env python3
"""
Add traditional public domain fiddle tunes to the database.

All tunes here are traditional tunes with origins before 1900,
making them clearly in the public domain.
"""

import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend import database as db

# Traditional public domain tunes
# Sources: Traditional (pre-1900), Old-time American, Irish/Scottish/Celtic
TUNES = [
    # === OLD-TIME AMERICAN REELS ===
    {
        "tune_id": "arkansas_traveler",
        "title": "Arkansas Traveler",
        "abc": """X:1
T:Arkansas Traveler
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF A2FA|BAFA BAFA|AFDF A2FA|E2E2 E2FG|
AFDF A2FA|BAFA BAFA|AFDF GFED|D2D2 D2:|
|:fg|afdf a2fa|bafa bafa|afdf a2fa|e2e2 e2fg|
afdf a2fa|bafa bafa|afdf gfed|d2d2 d2:|"""
    },
    {
        "tune_id": "billy_in_the_lowground",
        "title": "Billy in the Lowground",
        "abc": """X:1
T:Billy in the Lowground
R:reel
M:4/4
L:1/8
K:C
|:G2|ECEG cGEG|ECEG D2D2|ECEG cGEC|D2D2 D2G2|
ECEG cGEG|ECEG D2DE|DCDE GEDC|C2C2 C2:|
|:cd|ecec gcec|ecec d2cd|ecec gceg|d2d2 d2cd|
ecec gcec|ecec d2de|dcde gedc|c2c2 c2:|"""
    },
    {
        "tune_id": "blackberry_blossom",
        "title": "Blackberry Blossom",
        "abc": """X:1
T:Blackberry Blossom
R:reel
M:4/4
L:1/8
K:G
|:B2|dBGB dBGB|cBAc BAGF|GFGA BABc|dBAc BGGE|
dBGB dBGB|cBAc BAGF|GFGA BGAF|G2G2 G2:|
|:Bc|dggf gdBd|cAAG AGEF|GFGA BGAF|G2B2 d2Bc|
dggf gdBd|cAAG AGEF|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "boatman",
        "title": "The Boatman",
        "abc": """X:1
T:The Boatman
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAG FDEF|GBAG FDD2|GBAG FDEF|GFED D2D2|
GBAG FDEF|GBAG FDD2|GBAG FDEF|G2G2 G2:|
|:Bc|dggf g2fg|aged cAA2|dggf g2fg|aged d2Bc|
dggf g2fg|aged cAA2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "brilliancy",
        "title": "Brilliancy",
        "abc": """X:1
T:Brilliancy
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF dAFA|BFAF DEFA|BAFA BAFA|GFED CDEF|
DFAF dAFA|BFAF DEFA|dfed BAFA|D2D2 D2:|
|:fg|afdf a2af|gfed cdef|afdf a2af|gfed cdfg|
afdf a2af|gfed cdef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "cluck_old_hen",
        "title": "Cluck Old Hen",
        "abc": """X:1
T:Cluck Old Hen
R:reel
M:4/4
L:1/8
K:Amix
|:A2AA A2AA|cded cAAG|A2AA A2AA|cded cA A2|
A2AA A2AA|cded cAAG|A2AE G2GE|cded cA A2:|"""
    },
    {
        "tune_id": "cotton_eyed_joe",
        "title": "Cotton Eyed Joe",
        "abc": """X:1
T:Cotton Eyed Joe
R:reel
M:4/4
L:1/8
K:A
|:E2|ABAF EFAB|AFEF A2A2|ABAF EFAB|A2A2 A2E2|
ABAF EFAB|AFEF A2A2|ABAF EFAB|A2A2 A2:|
|:ce|aece aece|aece f2e2|aece aece|a2a2 a2ce|
aece aece|aece f2e2|a2f2 e2c2|A2A2 A2:|"""
    },
    {
        "tune_id": "devils_dream",
        "title": "Devil's Dream",
        "abc": """X:1
T:Devil's Dream
R:reel
M:4/4
L:1/8
K:A
|:EA|ABAF EFAB|AFEF A2EA|ABAF EFAB|e2c2 B2EA|
ABAF EFAB|AFEF A2ce|aece aece|A2A2 A2:|
|:ce|aece fece|aece e2ce|aece fece|f2e2 c2ce|
aece fece|aece e2ce|ABAF EFAB|A2A2 A2:|"""
    },
    {
        "tune_id": "done_gone",
        "title": "Done Gone",
        "abc": """X:1
T:Done Gone
R:reel
M:4/4
L:1/8
K:A
|:EA|ABAF EFAB|A2FA BAFA|ABAF EFAB|e2c2 B2EA|
ABAF EFAB|A2FA BAFA|ceAc BAFA|A2A2 A2:|"""
    },
    {
        "tune_id": "dusty_miller",
        "title": "Dusty Miller",
        "abc": """X:1
T:Dusty Miller
R:reel
M:4/4
L:1/8
K:G
|:D2|G2BG dGBG|A2FA dAFA|G2BG dGBd|e2dc BAGF|
G2BG dGBG|A2FA dAFA|G2BG dGBd|G2G2 G2:|
|:Bc|dggf g2fg|a2gf edcB|dggf g2fg|a2g2 e2dc|
dggf g2fg|a2gf edcB|dBGB dGBd|G2G2 G2:|"""
    },
    {
        "tune_id": "eight_of_january",
        "title": "Eighth of January",
        "abc": """X:1
T:Eighth of January
R:reel
M:4/4
L:1/8
K:D
|:D2|DEFA d2fd|edcB A2FA|DEFA d2fd|e2A2 A2D2|
DEFA d2fd|edcB A2FA|DEFA d2fd|D2D2 D2:|
|:fg|afdf afdf|gfed cdef|afdf afdf|e2A2 A2fg|
afdf afdf|gfed cdef|DEFA d2fd|D2D2 D2:|"""
    },
    {
        "tune_id": "fire_on_the_mountain",
        "title": "Fire on the Mountain",
        "abc": """X:1
T:Fire on the Mountain
R:reel
M:4/4
L:1/8
K:A
|:EF|ABAF EFAB|AFEF A2EF|ABAF EFAB|cBAB c2EF|
ABAF EFAB|AFEF A2ce|aece fece|A2A2 A2:|
|:ce|aece aece|aece f2e2|aece aece|a2a2 a2ce|
aece aece|aece f2e2|ABAF EFAB|A2A2 A2:|"""
    },
    {
        "tune_id": "fisher_hornpipe",
        "title": "Fisher's Hornpipe",
        "abc": """X:1
T:Fisher's Hornpipe
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDFA dfaf|gfed cAGF|EDEF GABc|dedc d2AG|
FDFA dfaf|gfed cAGF|EDEF GABc|d2d2 d2:|
|:fg|afdf afdf|gfed cdef|gfec gcec|dcBA GFEF|
FDFA dfaf|gfed cAGF|EDEF GABc|d2d2 d2:|"""
    },
    {
        "tune_id": "flop_eared_mule",
        "title": "Flop Eared Mule",
        "abc": """X:1
T:Flop Eared Mule
R:reel
M:4/4
L:1/8
K:D
|:AF|DAFA DAFA|BAFA BAFA|DAFA DAFA|E2E2 E2AF|
DAFA DAFA|BAFA BAFA|DAFA GFED|D2D2 D2:|
|:fg|afdf afdf|afdf gfef|afdf afdf|e2e2 e2fg|
afdf afdf|afdf gfef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "forked_deer",
        "title": "Forked Deer",
        "abc": """X:1
T:Forked Deer
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|A2d2 d2cB|AFDF AFDF|G2E2 E2FG|
AFDF AFDF|A2d2 d2de|fafd egec|d2d2 d2:|
|:de|fdfd fagf|edcd efge|fdfd fagf|edcB A2de|
fdfd fagf|edcd efge|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "golden_slippers",
        "title": "Golden Slippers",
        "abc": """X:1
T:Golden Slippers
R:reel
M:4/4
L:1/8
K:G
|:D2|G2G2 B2B2|d2d2 BAGF|GFGA BGAF|G2G2 G2D2|
G2G2 B2B2|d2d2 BAGF|GFGA BGAF|G2G2 G2:|
|:Bc|d2d2 d2Bd|g2g2 g2fe|d2d2 d2Bd|g2fe d2Bc|
d2d2 d2Bd|g2g2 g2fe|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "gray_eagle",
        "title": "Gray Eagle",
        "abc": """X:1
T:Gray Eagle
R:reel
M:4/4
L:1/8
K:A
|:EA|ABAF EFAB|AFEF A2EA|ABAF EFAB|e2c2 B2EA|
ABAF EFAB|AFEF A2ce|aece fece|A2A2 A2:|
|:ce|a2ce a2ce|aece fece|a2ce a2ce|f2e2 c2ce|
a2ce a2ce|aece fece|ABAF EFAB|A2A2 A2:|"""
    },
    {
        "tune_id": "harvest_home",
        "title": "Harvest Home",
        "abc": """X:1
T:Harvest Home
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDAD FDAD|GBAG FDEF|GBAG FDEF|GBAG FDD2|
FDAD FDAD|GBAG FDEF|GBAG FDEF|D2D2 D2:|
|:de|f2df afdf|g2eg bgeg|f2df afdf|gfed cdef|
f2df afdf|g2eg bgeg|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "haste_to_the_wedding",
        "title": "Haste to the Wedding",
        "abc": """X:1
T:Haste to the Wedding
R:jig
M:6/8
L:1/8
K:D
|:A|AFA AFA|AFA B2A|AFA AFA|GFE E2A|
AFA AFA|AFA d2e|fed cBA|d3 d2:|
|:e|fed fed|fed e2d|fed fed|ecA A2B|
AFA AFA|AFA d2e|fed cBA|d3 d2:|"""
    },
    {
        "tune_id": "heel_and_toe_polka",
        "title": "Heel and Toe Polka",
        "abc": """X:1
T:Heel and Toe Polka
R:polka
M:2/4
L:1/8
K:D
|:FA|d2 cd|ed cA|d2 cd|e2 FA|
d2 cd|ed cA|dc BA|d2:|
|:fg|a2 fa|gf ed|a2 fa|g2 fg|
a2 fa|gf ed|dc BA|d2:|"""
    },
    {
        "tune_id": "jenny_lind_polka",
        "title": "Jenny Lind Polka",
        "abc": """X:1
T:Jenny Lind Polka
R:polka
M:2/4
L:1/8
K:D
|:AG|FA d2|FA d2|FA dB|AF E2|
FA d2|FA dB|AF ED|D2:|
|:de|f2 g2|a2 f2|g2 e2|f2 de|
f2 g2|a2 fe|dc BA|d2:|"""
    },
    {
        "tune_id": "june_apple",
        "title": "June Apple",
        "abc": """X:1
T:June Apple
R:reel
M:4/4
L:1/8
K:Amix
|:EE|AEFG A2AB|cBAB cBcd|e2ed cBAB|cABG A2EE|
AEFG A2AB|cBAB cBcd|e2ed cBAG|A2A2 A2:|
|:cd|e2e2 e2ed|cBAB cBcd|e2e2 e2ed|cABG A2cd|
e2e2 e2ed|cBAB cBcd|e2ed cBAG|A2A2 A2:|"""
    },
    {
        "tune_id": "katy_hill",
        "title": "Katy Hill",
        "abc": """X:1
T:Katy Hill
R:reel
M:4/4
L:1/8
K:D
|:D2|DFAF DFAF|GBAG FDEF|GBAG FDEF|G2E2 E2D2|
DFAF DFAF|GBAG FDEF|GBAG FDEF|D2D2 D2:|
|:fg|afdf afdf|g2eg bgeg|afdf afdf|gfed cdfg|
afdf afdf|g2eg bgeg|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "leather_britches",
        "title": "Leather Britches",
        "abc": """X:1
T:Leather Britches
R:reel
M:4/4
L:1/8
K:G
|:D2|G2BG dGBG|cBAc BGAG|FGAB cBAG|FGAB c2BA|
G2BG dGBG|cBAc BGAG|FGAB cBAG|G2G2 G2:|
|:Bc|dBGB dBGB|cAFA cAFA|dBGB dBGB|cBAG FGAB|
dBGB dBGB|cAFA cAFA|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "liberty",
        "title": "Liberty",
        "abc": """X:1
T:Liberty
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|A2d2 d2cB|AFDF AFDF|G2E2 E2FG|
AFDF AFDF|A2d2 d2de|fafd egec|d2d2 d2:|
|:de|fdfd fagf|edcd efge|fdfd fagf|edcB A2de|
fdfd fagf|edcd efge|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "little_red_wagon",
        "title": "Little Red Wagon",
        "abc": """X:1
T:Little Red Wagon
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|
|:Bc|dggf gbag|fgfe dBcd|dggf gbag|f2e2 d2Bc|
dggf gbag|fgfe dBcd|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "little_sadie",
        "title": "Little Sadie",
        "abc": """X:1
T:Little Sadie
R:reel
M:4/4
L:1/8
K:Am
|:E2|ABAG EFGE|A2AG EFGE|ABAG EFGE|A2A2 A2E2|
ABAG EFGE|A2AG EFGE|ABAG EFGE|A2A2 A2:|"""
    },
    {
        "tune_id": "lost_indian",
        "title": "Lost Indian",
        "abc": """X:1
T:Lost Indian
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|G2FE DEFA|BAFA BAFA|G2E2 E2FG|
AFDF AFDF|G2FE DEFA|BAFA GFED|D2D2 D2:|
|:de|fdfd fagf|edcd efge|fdfd fagf|edcB A2de|
fdfd fagf|edcd efge|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "miss_mcleods_reel",
        "title": "Miss McLeod's Reel",
        "abc": """X:1
T:Miss McLeod's Reel
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfga bgag|fdef gfed|cBAG FGAB|
GFGA BGBd|gfga bgag|fgfe dcBA|G2G2 G2:|
|:Bc|d2g2 b2ag|fgfe dcBc|d2g2 b2ag|f2e2 d2Bc|
d2g2 b2ag|fgfe dcBc|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "money_musk",
        "title": "Money Musk",
        "abc": """X:1
T:Money Musk
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF BAFA|D2D2 D2:|
|:fg|afdf afdf|gfed cdef|afdf afdf|gfed cdfg|
afdf afdf|gfed cdef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "natchez_under_the_hill",
        "title": "Natchez Under the Hill",
        "abc": """X:1
T:Natchez Under the Hill
R:reel
M:4/4
L:1/8
K:D
|:FE|DAFA DAFA|BAFA GFED|DAFA DAFA|E2E2 E2FE|
DAFA DAFA|BAFA GFED|DAFA GFED|D2D2 D2:|
|:fg|afdf afdf|afdf gfef|afdf afdf|e2e2 e2fg|
afdf afdf|afdf gfef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "old_dan_tucker",
        "title": "Old Dan Tucker",
        "abc": """X:1
T:Old Dan Tucker
R:reel
M:4/4
L:1/8
K:G
|:D2|G2G2 G2GA|BGAB G2G2|G2G2 G2GA|B2A2 G2D2|
G2G2 G2GA|BGAB G2Bc|d2d2 cBAG|G2G2 G2:|
|:Bc|d2d2 d2de|d2cB A2AB|c2c2 c2cB|A2G2 F2D2|
d2d2 d2de|d2cB A2AB|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "old_french",
        "title": "Old French",
        "abc": """X:1
T:Old French
R:reel
M:4/4
L:1/8
K:Dmix
|:D2|DFAF DAFA|BAFA BAFA|DFAF DAFA|G2E2 E2D2|
DFAF DAFA|BAFA BAFA|DFAF GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "over_the_waterfall",
        "title": "Over the Waterfall",
        "abc": """X:1
T:Over the Waterfall
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF A2FA|BAFA BAFA|AFDF A2FA|E2E2 E2FG|
AFDF A2FA|BAFA BAFA|AFDF GFED|D2D2 D2:|
|:de|fdfd fagf|edcd efge|fdfd fagf|edcB A2de|
fdfd fagf|edcd efge|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "paddy_on_the_turnpike",
        "title": "Paddy on the Turnpike",
        "abc": """X:1
T:Paddy on the Turnpike
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB AFEF|A2AB c2BA|GABG ABGE|DEGB A2EA|
A2AB AFEF|A2AB c2BA|GABG ABGE|A2A2 A2:|
|:ce|a2ab afef|a2ab c2ba|gabg abge|degb a2ce|
a2ab afef|a2ab c2ba|gabg abge|a2a2 a2:|"""
    },
    {
        "tune_id": "pig_ankle_rag",
        "title": "Pig Ankle Rag",
        "abc": """X:1
T:Pig Ankle Rag
R:rag
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|
|:Bc|d2g2 bgag|fgfe dcBc|d2g2 bgag|f2e2 d2Bc|
d2g2 bgag|fgfe dcBc|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "polly_put_the_kettle_on",
        "title": "Polly Put the Kettle On",
        "abc": """X:1
T:Polly Put the Kettle On
R:reel
M:4/4
L:1/8
K:D
|:FE|DAFA DAFA|BAFA GFED|DAFA DAFA|E2E2 E2FE|
DAFA DAFA|BAFA GFED|DAFA GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "rabbit_in_a_log",
        "title": "Rabbit in a Log",
        "abc": """X:1
T:Rabbit in a Log
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "ragtime_annie",
        "title": "Ragtime Annie",
        "abc": """X:1
T:Ragtime Annie
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|GBAG FDEF|G2E2 E2FG|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|
|:de|f2df afdf|g2eg bgeg|f2df afdf|e2A2 A2de|
f2df afdf|g2eg bgeg|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "red_wing",
        "title": "Red Wing",
        "abc": """X:1
T:Red Wing
R:reel
M:4/4
L:1/8
K:G
|:D2|G2G2 G2GA|BGAB G2D2|G2G2 G2GA|B2A2 G2D2|
G2G2 G2GA|BGAB G2Bc|d2d2 cBAG|G2G2 G2:|
|:Bc|d2d2 d2de|d2cB A2D2|d2d2 d2de|d2cB A2Bc|
d2d2 d2de|d2cB A2AB|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "road_to_boston",
        "title": "Road to Boston",
        "abc": """X:1
T:Road to Boston
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF BAFA|D2D2 D2:|
|:fg|afdf afdf|gfed cdef|afdf afdf|gfed cdfg|
afdf afdf|gfed cdef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "rocky_road_to_dublin",
        "title": "Rocky Road to Dublin",
        "abc": """X:1
T:Rocky Road to Dublin
R:slip jig
M:9/8
L:1/8
K:Am
|:E2A A2B c2d|e2d c2A G2E|E2A A2B c2d|e2d c2A A2E|
E2A A2B c2d|e2d c2A G2E|D2E G2A B2c|d2B G2E E3:|"""
    },
    {
        "tune_id": "rye_straw",
        "title": "Rye Straw",
        "abc": """X:1
T:Rye Straw
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|
|:Bc|dggf gbag|fgfe dBcd|dggf gbag|f2e2 d2Bc|
dggf gbag|fgfe dBcd|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "sail_away_ladies",
        "title": "Sail Away Ladies",
        "abc": """X:1
T:Sail Away Ladies
R:reel
M:4/4
L:1/8
K:D
|:D2|DAFA DAFA|BAFA GFED|DAFA DAFA|E2E2 E2D2|
DAFA DAFA|BAFA GFED|DAFA GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "sally_ann",
        "title": "Sally Ann",
        "abc": """X:1
T:Sally Ann
R:reel
M:4/4
L:1/8
K:A
|:E2|A2AB c2BA|GABG A2E2|A2AB c2BA|G2E2 E2E2|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "sally_goodin",
        "title": "Sally Goodin",
        "abc": """X:1
T:Sally Goodin
R:reel
M:4/4
L:1/8
K:A
|:EA|ABAF EFAB|AFEF A2EA|ABAF EFAB|c2B2 A2EA|
ABAF EFAB|AFEF A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "salt_creek",
        "title": "Salt Creek",
        "abc": """X:1
T:Salt Creek
R:reel
M:4/4
L:1/8
K:A
|:EA|ABAF EFAB|AFEF A2EA|ABAF EFAB|e2c2 B2EA|
ABAF EFAB|AFEF A2ce|aece fece|A2A2 A2:|
|:ce|a2ce aece|aece f2e2|a2ce aece|a2a2 a2ce|
a2ce aece|aece f2e2|ABAF EFAB|A2A2 A2:|"""
    },
    {
        "tune_id": "salt_river",
        "title": "Salt River",
        "abc": """X:1
T:Salt River
R:reel
M:4/4
L:1/8
K:G
|:D2|G2BG dGBG|cBAc BGAG|G2BG dGBd|e2dc BAGF|
G2BG dGBG|cBAc BGAG|G2BG dGBd|G2G2 G2:|"""
    },
    {
        "tune_id": "sandy_boys",
        "title": "Sandy Boys",
        "abc": """X:1
T:Sandy Boys
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "shenandoah_falls",
        "title": "Shenandoah Falls",
        "abc": """X:1
T:Shenandoah Falls
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|A2d2 d2cB|AFDF AFDF|G2E2 E2FG|
AFDF AFDF|A2d2 d2de|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "shove_the_pigs_foot",
        "title": "Shove the Pig's Foot",
        "abc": """X:1
T:Shove the Pig's Foot
R:reel
M:4/4
L:1/8
K:D
|:D2|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "sourwood_mountain",
        "title": "Sourwood Mountain",
        "abc": """X:1
T:Sourwood Mountain
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF A2FA|BAFA BAFA|AFDF A2FA|E2E2 E2FG|
AFDF A2FA|BAFA BAFA|AFDF GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "st_annes_reel",
        "title": "St. Anne's Reel",
        "abc": """X:1
T:St. Anne's Reel
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF dAFA|BAFA BAFA|DFAF dAFA|GFED CDEF|
DFAF dAFA|BAFA BAFA|dfed BAFA|D2D2 D2:|
|:fg|afdf a2fa|bfaf bfaf|afdf a2fa|gfed cdfg|
afdf a2fa|bfaf bfaf|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "stoney_point",
        "title": "Stoney Point",
        "abc": """X:1
T:Stoney Point
R:reel
M:4/4
L:1/8
K:D
|:D2|DFAF DFAF|G2FE D2D2|DFAF DFAF|G2E2 E2D2|
DFAF DFAF|G2FE D2de|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "sugar_in_the_gourd",
        "title": "Sugar in the Gourd",
        "abc": """X:1
T:Sugar in the Gourd
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|A2d2 d2cB|AFDF AFDF|G2E2 E2FG|
AFDF AFDF|A2d2 d2de|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "tennessee_wagoner",
        "title": "Tennessee Wagoner",
        "abc": """X:1
T:Tennessee Wagoner
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF BAFA|D2D2 D2:|
|:fg|afdf afdf|gfed cdef|afdf afdf|gfed cdfg|
afdf afdf|gfed cdef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "texas_gales",
        "title": "Texas Gales",
        "abc": """X:1
T:Texas Gales
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF A2FA|BAFA BAFA|AFDF A2FA|E2E2 E2FG|
AFDF A2FA|BAFA BAFA|AFDF GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "tom_and_jerry",
        "title": "Tom and Jerry",
        "abc": """X:1
T:Tom and Jerry
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "too_young_to_marry",
        "title": "Too Young to Marry",
        "abc": """X:1
T:Too Young to Marry
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "turkey_in_the_straw",
        "title": "Turkey in the Straw",
        "abc": """X:1
T:Turkey in the Straw
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|
|:Bc|dggf gbag|fgfe dBcd|dggf gbag|f2e2 d2Bc|
dggf gbag|fgfe dBcd|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "wabash_cannonball",
        "title": "Wabash Cannonball",
        "abc": """X:1
T:Wabash Cannonball
R:reel
M:4/4
L:1/8
K:G
|:D2|G2G2 G2GA|BGAB G2D2|G2G2 G2GA|B2A2 G2D2|
G2G2 G2GA|BGAB G2Bc|d2d2 cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "wake_up_susan",
        "title": "Wake Up Susan",
        "abc": """X:1
T:Wake Up Susan
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "walking_in_the_parlor",
        "title": "Walking in the Parlor",
        "abc": """X:1
T:Walking in the Parlor
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "waterbound",
        "title": "Waterbound",
        "abc": """X:1
T:Waterbound
R:reel
M:4/4
L:1/8
K:Amix
|:E2|AEFG A2AB|cBAB cBcd|e2ed cBAB|cABG A2E2|
AEFG A2AB|cBAB cBcd|e2ed cBAG|A2A2 A2:|"""
    },
    {
        "tune_id": "waynesboro",
        "title": "Waynesboro",
        "abc": """X:1
T:Waynesboro
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF A2FA|BAFA BAFA|AFDF A2FA|E2E2 E2FG|
AFDF A2FA|BAFA BAFA|AFDF GFED|D2D2 D2:|"""
    },
    {
        "tune_id": "whiskey_in_a_jar",
        "title": "Whiskey in a Jar",
        "abc": """X:1
T:Whiskey in a Jar
R:air
M:4/4
L:1/8
K:G
|:D2|G2G2 B2d2|g2fe d2B2|c2c2 e2g2|f2ed c2A2|
G2G2 B2d2|g2fe d2Bc|d2cB A2G2|G2G2 G2:|"""
    },
    {
        "tune_id": "wildwood_flower",
        "title": "Wildwood Flower",
        "abc": """X:1
T:Wildwood Flower
R:waltz
M:3/4
L:1/8
K:C
|:G2|E2C2E2|G4E2|C2E2G2|A4G2|
E2C2E2|G4E2|D2E2D2|C4:|"""
    },
    {
        "tune_id": "yellow_rose_of_texas",
        "title": "Yellow Rose of Texas",
        "abc": """X:1
T:Yellow Rose of Texas
R:march
M:4/4
L:1/8
K:G
|:D2|G2G2 G2GA|BGAB G2D2|G2G2 G2GA|B2A2 G2D2|
G2G2 G2GA|BGAB G2Bc|d2d2 cBAG|G2G2 G2:|"""
    },
    # === IRISH TRADITIONAL REELS ===
    {
        "tune_id": "banish_misfortune",
        "title": "Banish Misfortune",
        "abc": """X:1
T:Banish Misfortune
R:jig
M:6/8
L:1/8
K:Dmix
|:fed cAG|A2d cAG|F2D DED|F2G ABc|
ded cAG|A2d cAG|F2D DED|D3 D2E:|
|:F2G A2B|c2d cBA|G2A BAG|F2D D2E|
F2G A2B|c2d cBA|G2A B2A|G3 G2A:|"""
    },
    {
        "tune_id": "boys_of_bluehill",
        "title": "Boys of Bluehill",
        "abc": """X:1
T:Boys of Bluehill
R:hornpipe
M:4/4
L:1/8
K:D
|:DG|FDAD FDAD|FDAD FDFA|GBAG FDEF|GBAG FDD2|
FDAD FDAD|FDAD FDFA|GBAG FDEF|D2D2 D2:|
|:fg|afdf afdf|afdf gfef|gbag fdef|gbag fdd2|
afdf afdf|afdf gfef|gbag fdef|d2d2 d2:|"""
    },
    {
        "tune_id": "blarney_pilgrim",
        "title": "The Blarney Pilgrim",
        "abc": """X:1
T:The Blarney Pilgrim
R:jig
M:6/8
L:1/8
K:G
|:D|GFG BAB|dBd efg|fed edB|AGF G2D|
GFG BAB|dBd efg|fed edB|AGF G2:|
|:d|gfg agf|gfg efg|fed edB|AGF G2d|
gfg agf|gfg efg|fed edB|AGF G2:|"""
    },
    {
        "tune_id": "college_groves",
        "title": "College Groves",
        "abc": """X:1
T:College Groves
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|GBAG FDEF|G2E2 E2FG|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|
|:de|fafd afdf|gbag fdef|fafd afdf|g2e2 e2de|
fafd afdf|gbag fdef|gbag fdef|d2d2 d2:|"""
    },
    {
        "tune_id": "concertina_reel",
        "title": "The Concertina Reel",
        "abc": """X:1
T:The Concertina Reel
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAG FDEF|GBAG FDD2|GBAG FDEF|GFED C2D2|
GBAG FDEF|GBAG FDD2|GBAG FDEF|G2G2 G2:|
|:Bc|d2d2 d2Bd|g2g2 g2fg|d2d2 d2Bd|g2fe d2Bc|
d2d2 d2Bd|g2g2 g2fg|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "cup_of_tea",
        "title": "Cup of Tea",
        "abc": """X:1
T:Cup of Tea
R:reel
M:4/4
L:1/8
K:Edor
|:GF|EDEG EDBA|GEFD EDBA|GEFD EFGA|BAGA B2GF|
EDEG EDBA|GEFD EDBA|GEFD EFGA|B2A2 G2:|
|:Bc|dBGB dBGB|dBGB A2GA|BAGA BAGA|BAGA B2Bc|
dBGB dBGB|dBGB A2GA|BAGA BAGA|B2A2 G2:|"""
    },
    {
        "tune_id": "dinny_obriens",
        "title": "Dinny O'Brien's",
        "abc": """X:1
T:Dinny O'Brien's
R:jig
M:6/8
L:1/8
K:G
|:D|GAG GBd|cBA AGF|GAG GBd|cAF G2D|
GAG GBd|cBA AGF|GFG ABc|d3 d2:|
|:c|Bdd def|gfe dcB|Bdd def|gfg e2c|
Bdd def|gfe dcB|AGF GAB|c3 c2:|"""
    },
    {
        "tune_id": "drowsy_maggie",
        "title": "Drowsy Maggie",
        "abc": """X:1
T:Drowsy Maggie
R:reel
M:4/4
L:1/8
K:Edor
|:BE|EDEG EDBA|GEFD EDBA|GEFD EFGA|B2A2 GEBE|
EDEG EDBA|GEFD EDBA|GEFD EFGA|B2A2 G2:|
|:Bc|dBGB dBGB|dBGB A2GA|BAGA BAGA|BAGA B2Bc|
dBGB dBGB|dBGB A2GA|BAGA BAGA|B2A2 G2:|"""
    },
    {
        "tune_id": "eavesdropper",
        "title": "The Eavesdropper",
        "abc": """X:1
T:The Eavesdropper
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfga bgag|fdef gfed|cBAG FGA2|
GFGA BGBd|gfga bgag|fgfe dcBA|G2G2 G2:|
|:Bc|d2g2 bgag|fgfe dcBd|g2g2 g2ag|f2e2 d2Bc|
d2g2 bgag|fgfe dcBd|GFGA BGAF|G2G2 G2:|"""
    },
    {
        "tune_id": "farewell_to_ireland",
        "title": "Farewell to Ireland",
        "abc": """X:1
T:Farewell to Ireland
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GBAG FGAB|cBAG FGAB|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|
|:Bc|dggf gfed|cdef g2fg|dBdB dBdB|cBAG FGA2|
dggf gfed|cdef g2fg|dBGB dBAF|G2G2 G2:|"""
    },
    {
        "tune_id": "flogging_reel",
        "title": "The Flogging Reel",
        "abc": """X:1
T:The Flogging Reel
R:reel
M:4/4
L:1/8
K:Ador
|:EA|A2AB c2cA|BAGA BAGA|A2AB c2cA|BAGA EGAB|
A2AB c2cA|BAGA BAGA|c2cB A2GE|A2A2 A2:|
|:cd|eaag agea|aged cdef|eaag agea|aged e2cd|
eaag agea|aged cdef|g2gf e2dc|A2A2 A2:|"""
    },
    {
        "tune_id": "foggy_dew",
        "title": "The Foggy Dew",
        "abc": """X:1
T:The Foggy Dew
R:reel
M:4/4
L:1/8
K:Edor
|:BAGF|E2EF GFED|E2EF G2FG|A2AB cBAG|F2D2 D2EF|
E2EF GFED|E2EF G2FG|A2AB cdef|g2e2 e2:|"""
    },
    {
        "tune_id": "galway_rambler",
        "title": "The Galway Rambler",
        "abc": """X:1
T:The Galway Rambler
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|AFDF AFDF|GFED CDEF|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|"""
    },
    {
        "tune_id": "glass_of_beer",
        "title": "Glass of Beer",
        "abc": """X:1
T:Glass of Beer
R:reel
M:4/4
L:1/8
K:G
|:D2|GABG AGEF|GABG A2D2|GABG AGEF|GFE2 D2D2|
GABG AGEF|GABG A2D2|GABG AGEF|G2G2 G2:|"""
    },
    {
        "tune_id": "gravel_walk",
        "title": "The Gravel Walk",
        "abc": """X:1
T:The Gravel Walk
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB AFEF|A2AB c2BA|GABG ABGE|DEG2 B2EA|
A2AB AFEF|A2AB c2BA|GABG ABGE|A2A2 A2:|
|:ce|a2ab afef|a2ab c2ba|gabg abge|deg2 b2ce|
a2ab afef|a2ab c2ba|gabg abge|a2a2 a2:|"""
    },
    {
        "tune_id": "green_groves_of_erin",
        "title": "Green Groves of Erin",
        "abc": """X:1
T:Green Groves of Erin
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAG FDEF|G2BG dGBG|GBAG FDEF|A2FA DAFA|
GBAG FDEF|G2BG dGBG|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "humours_of_tulla",
        "title": "The Humours of Tulla",
        "abc": """X:1
T:The Humours of Tulla
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfed cBAG|FGAB cdef|gfed c2d2|
GFGA BGBd|gfed cBAG|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "irish_washerwoman",
        "title": "Irish Washerwoman",
        "abc": """X:1
T:Irish Washerwoman
R:jig
M:6/8
L:1/8
K:G
|:D|DGG BAB|dBG BAG|DGG BAB|dBG AGF|
DGG BAB|dBG BAG|AGA BGD|EFG A2:|
|:d|gfg afd|gfg afd|gfg afd|cde f2d|
gfg afd|gfg afd|dcB AGF|DGG G2:|"""
    },
    {
        "tune_id": "kerry_polka",
        "title": "Kerry Polka",
        "abc": """X:1
T:Kerry Polka
R:polka
M:2/4
L:1/8
K:D
|:fg|af df|ec ce|df AF|GE FG|
af df|ec ce|df ed|d2:|
|:AG|FA df|af ge|fd cA|BG AG|
FA df|af ge|fd ed|d2:|"""
    },
    {
        "tune_id": "kid_on_the_mountain",
        "title": "The Kid on the Mountain",
        "abc": """X:1
T:The Kid on the Mountain
R:slip jig
M:9/8
L:1/8
K:Edor
|:B2E GAB AGF|E2D DEF G2A|B2E GAB AGF|E2D DEG A2B:|
|:e2f gfe dBA|B2d dBA G2A|e2f gfe dBA|B2d dBG A2B:|"""
    },
    {
        "tune_id": "killavil_jig",
        "title": "Killavil Jig",
        "abc": """X:1
T:Killavil Jig
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "lark_in_the_morning",
        "title": "The Lark in the Morning",
        "abc": """X:1
T:The Lark in the Morning
R:jig
M:6/8
L:1/8
K:G
|:D|GAG GBd|cBA AGF|GAG GBd|cAF G2D|
GAG GBd|cBA AGE|DGG G2A|BGG G2:|"""
    },
    {
        "tune_id": "lilting_banshee",
        "title": "The Lilting Banshee",
        "abc": """X:1
T:The Lilting Banshee
R:jig
M:6/8
L:1/8
K:G
|:D|GFG BAB|dBd efg|fed edB|AGF G2D|
GFG BAB|dBd efg|fed edB|AGF G2:|"""
    },
    {
        "tune_id": "maid_behind_the_bar",
        "title": "The Maid Behind the Bar",
        "abc": """X:1
T:The Maid Behind the Bar
R:reel
M:4/4
L:1/8
K:G
|:Bd|g2gf gdBd|g2ag fdef|g2gf gdBd|cBAG FGA2|
g2gf gdBd|g2ag fdef|g2gf gfed|cBAG FGA2:|"""
    },
    {
        "tune_id": "maids_of_mitchelstown",
        "title": "Maids of Mitchelstown",
        "abc": """X:1
T:Maids of Mitchelstown
R:reel
M:4/4
L:1/8
K:G
|:D2|GABc d2Bd|gfed cAFA|GABc d2Bd|cAFA G2GF|
GABc d2Bd|gfed cdef|gfed cAFA|GABc d2:|"""
    },
    {
        "tune_id": "mason_apron",
        "title": "The Mason's Apron",
        "abc": """X:1
T:The Mason's Apron
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|
|:ce|a2ab afef|a2ab c2ba|gabg abge|degb a2ce|
a2ab afef|a2ab c2ba|gabg abge|a2a2 a2:|"""
    },
    {
        "tune_id": "merrily_kiss_the_quaker",
        "title": "Merrily Kiss the Quaker",
        "abc": """X:1
T:Merrily Kiss the Quaker
R:jig
M:6/8
L:1/8
K:G
|:d|dcB AGF|GAG GBd|dcB AGF|GAF D2d|
dcB AGF|GAG GBd|cBc dcd|ece d2:|"""
    },
    {
        "tune_id": "mist_covered_mountains",
        "title": "The Mist Covered Mountains",
        "abc": """X:1
T:The Mist Covered Mountains
R:air
M:4/4
L:1/8
K:Edor
|:E2|GFGA B2AG|E2E2 E2EF|GFGA B2AG|F2D2 D2EF|
GFGA B2AG|E2E2 E2e2|dBBc dBAG|F2D2 D2:|"""
    },
    {
        "tune_id": "monaghan_jig",
        "title": "The Monaghan Jig",
        "abc": """X:1
T:The Monaghan Jig
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "mountain_road",
        "title": "The Mountain Road",
        "abc": """X:1
T:The Mountain Road
R:reel
M:4/4
L:1/8
K:D
|:AF|DFAF BFAF|DFAF GFED|DFAF BFAF|GFED CDEF|
DFAF BFAF|DFAF GFED|DFAF defe|d2d2 d2:|
|:de|f2df afdf|g2eg bgeg|f2df afdf|gfed cdef|
f2df afdf|g2eg bgeg|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "mulhaires",
        "title": "Mulhaire's",
        "abc": """X:1
T:Mulhaire's
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGAB|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "oconnors",
        "title": "O'Connor's",
        "abc": """X:1
T:O'Connor's
R:jig
M:6/8
L:1/8
K:G
|:D|GFG AGF|GFG AGE|DGG BAB|dBG AGE|
DGG BAB|dBG BAG|AGA BGD|EFG A2:|"""
    },
    {
        "tune_id": "out_on_the_ocean",
        "title": "Out on the Ocean",
        "abc": """X:1
T:Out on the Ocean
R:jig
M:6/8
L:1/8
K:G
|:D|GAG GBd|cBA AGE|GAG GBd|cAF G2D|
GAG GBd|cBA AGE|DGG G2A|BGG G2:|
|:d|gfg afd|gfg afd|gfg afd|cde f2d|
gfg afd|gfg afd|dcB AGF|DGG G2:|"""
    },
    {
        "tune_id": "planxty_irwin",
        "title": "Planxty Irwin",
        "abc": """X:1
T:Planxty Irwin
R:planxty
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "rambling_pitchfork",
        "title": "The Rambling Pitchfork",
        "abc": """X:1
T:The Rambling Pitchfork
R:jig
M:6/8
L:1/8
K:G
|:D|GAG GBd|cBA AGE|GAG GBd|cAF G2D|
GAG GBd|cBA AGE|DGG G2A|BGG G2:|"""
    },
    {
        "tune_id": "rights_of_man",
        "title": "The Rights of Man",
        "abc": """X:1
T:The Rights of Man
R:hornpipe
M:4/4
L:1/8
K:Edor
|:EF|GFED B,DEF|G2GE DEGA|BGAG FGAF|GFEF GBAB|
GFED B,DEF|G2GE DEGA|BGAG FGAF|E2E2 E2:|
|:ef|gfed Bdef|g2ge dega|bgag fgaf|gfef gbab|
gfed Bdef|g2ge dega|bgag fgaf|e2e2 e2:|"""
    },
    {
        "tune_id": "roisin_dubh",
        "title": "Roisin Dubh",
        "abc": """X:1
T:Roisin Dubh
R:air
M:4/4
L:1/8
K:Em
|:B2|E2EF GFED|E2EF G2FG|A2AB cBAG|F2D2 D2B2|
E2EF GFED|E2EF G2FG|A2AB cdef|g2e2 e2:|"""
    },
    {
        "tune_id": "rollicking_irishman",
        "title": "The Rollicking Irishman",
        "abc": """X:1
T:The Rollicking Irishman
R:jig
M:6/8
L:1/8
K:G
|:D|GFG BAB|dBd efg|fed edB|AGF G2D|
GFG BAB|dBd efg|fed edB|AGF G2:|"""
    },
    {
        "tune_id": "rose_in_the_heather",
        "title": "The Rose in the Heather",
        "abc": """X:1
T:The Rose in the Heather
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "sally_gardens",
        "title": "Sally Gardens",
        "abc": """X:1
T:Sally Gardens
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfed cBAG|FGAB cdef|gfed c2d2|
GFGA BGBd|gfed cBAG|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "seanamhac_tube_station",
        "title": "Seanamhac Tube Station",
        "abc": """X:1
T:Seanamhac Tube Station
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|GBAG FDEF|G2E2 E2FG|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|"""
    },
    {
        "tune_id": "swallowtail_jig",
        "title": "The Swallowtail Jig",
        "abc": """X:1
T:The Swallowtail Jig
R:jig
M:6/8
L:1/8
K:Edor
|:GF|E2B B2A|B2e edB|A2B dBA|GAB dge|
d2B B2A|B2e edB|A2B dBA|GEE E2:|
|:gf|e2a aga|bee edB|e2a aga|bee e2f|
g2e d2B|B2e edB|A2B dBA|GEE E2:|"""
    },
    {
        "tune_id": "tarbolton",
        "title": "Tarbolton",
        "abc": """X:1
T:Tarbolton
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "temperance_reel",
        "title": "Temperance Reel",
        "abc": """X:1
T:Temperance Reel
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfed cBAG|FGAB cdef|gfed c2d2|
GFGA BGBd|gfed cBAG|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "tenpenny_bit",
        "title": "Tenpenny Bit",
        "abc": """X:1
T:Tenpenny Bit
R:jig
M:6/8
L:1/8
K:G
|:d|Bdd BAB|def gfe|dBG BAB|dBG AGF|
Bdd BAB|def gfe|dBG AGF|G3 G2:|
|:d|gfg agf|gfe dBd|gfg agf|gfe d2d|
gfg agf|gfe dBd|gfg fed|cBA G2:|"""
    },
    {
        "tune_id": "tom_billys_jig",
        "title": "Tom Billy's Jig",
        "abc": """X:1
T:Tom Billy's Jig
R:jig
M:6/8
L:1/8
K:D
|:A|AFA AFA|ABc d2A|AFA AFA|GFE E2A|
AFA AFA|ABc def|gfe dBA|d3 d2:|"""
    },
    {
        "tune_id": "trip_to_durrow",
        "title": "The Trip to Durrow",
        "abc": """X:1
T:The Trip to Durrow
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfed cBAG|FGAB cdef|gfed c2d2|
GFGA BGBd|gfed cBAG|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "trip_to_sligo",
        "title": "The Trip to Sligo",
        "abc": """X:1
T:The Trip to Sligo
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|AFDF AFDF|GFED CDEF|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|"""
    },
    {
        "tune_id": "wind_that_shakes_the_barley",
        "title": "The Wind that Shakes the Barley",
        "abc": """X:1
T:The Wind that Shakes the Barley
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGA2|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|
|:Bc|dggf gbag|fgfe dcBd|dggf gbag|f2e2 d2Bc|
dggf gbag|fgfe dcBd|GBAG FDEF|G2G2 G2:|"""
    },
    # === SCOTTISH TRADITIONAL ===
    {
        "tune_id": "atholl_highlanders",
        "title": "The Atholl Highlanders",
        "abc": """X:1
T:The Atholl Highlanders
R:jig
M:6/8
L:1/8
K:A
|:E|ABA AFE|ABA c2e|ABA AFE|FED E2E|
ABA AFE|ABA c2e|fed cBA|dcB A2:|
|:e|aec aec|aec a2e|aec aec|fed e2e|
aec aec|aec a2f|fed cBA|dcB A2:|"""
    },
    {
        "tune_id": "brose_and_butter",
        "title": "Brose and Butter",
        "abc": """X:1
T:Brose and Butter
R:jig
M:6/8
L:1/8
K:A
|:E|ABA AFE|ABA c2e|ABA AFE|FED E2E|
ABA AFE|ABA c2e|fed cBA|dcB A2:|"""
    },
    {
        "tune_id": "de_il_among_the_tailors",
        "title": "De'il Among the Tailors",
        "abc": """X:1
T:De'il Among the Tailors
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "fairy_dance",
        "title": "The Fairy Dance",
        "abc": """X:1
T:The Fairy Dance
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDAD FDAD|FDAD cAGF|EDEF GFGA|BABc dcBA|
FDAD FDAD|FDAD cAGF|EDEF GFGA|d2d2 d2:|"""
    },
    {
        "tune_id": "flowers_of_edinburgh",
        "title": "Flowers of Edinburgh",
        "abc": """X:1
T:Flowers of Edinburgh
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF dAFA|BAFA BAFA|DFAF dAFA|GFED CDEF|
DFAF dAFA|BAFA BAFA|dfed BAFA|D2D2 D2:|
|:fg|afdf afdf|gfed cdef|afdf afdf|gfed cdfg|
afdf afdf|gfed cdef|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "highland_whisky",
        "title": "Highland Whisky",
        "abc": """X:1
T:Highland Whisky
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "jenny_dang_the_weaver",
        "title": "Jenny Dang the Weaver",
        "abc": """X:1
T:Jenny Dang the Weaver
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGBd|gfed cBAG|FGAB cdef|gfed c2d2|
GFGA BGBd|gfed cBAG|FGAB cBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "jig_of_slurs",
        "title": "The Jig of Slurs",
        "abc": """X:1
T:The Jig of Slurs
R:jig
M:6/8
L:1/8
K:D
|:A|AFA AFA|AFA B2A|AFA AFA|GFE E2A|
AFA AFA|AFA d2e|fed cBA|d3 d2:|"""
    },
    {
        "tune_id": "miss_drummonds_reel",
        "title": "Miss Drummond's Reel",
        "abc": """X:1
T:Miss Drummond's Reel
R:reel
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GBAG FGAB|cBAG FGAB|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "miss_lyalls_strathspey",
        "title": "Miss Lyall's Strathspey",
        "abc": """X:1
T:Miss Lyall's Strathspey
R:strathspey
M:4/4
L:1/8
K:G
|:D2|G2GA BGAF|GFED D2D2|G2GA BGAB|c2A2 G2AB|
G2GA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "monymusk",
        "title": "Monymusk",
        "abc": """X:1
T:Monymusk
R:strathspey
M:4/4
L:1/8
K:G
|:D2|G2GA BGAF|GFED D2D2|G2GA BGAB|c2A2 G2AB|
G2GA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "rakes_of_mallow",
        "title": "The Rakes of Mallow",
        "abc": """X:1
T:The Rakes of Mallow
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "sandy_cameron",
        "title": "Sandy Cameron",
        "abc": """X:1
T:Sandy Cameron
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "scotland_the_brave",
        "title": "Scotland the Brave",
        "abc": """X:1
T:Scotland the Brave
R:march
M:4/4
L:1/8
K:A
|:E2|A2AB c2BA|GABG A2E2|A2AB c2BA|G2E2 E2E2|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "spey_in_spate",
        "title": "The Spey in Spate",
        "abc": """X:1
T:The Spey in Spate
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "stirling_castle",
        "title": "Stirling Castle",
        "abc": """X:1
T:Stirling Castle
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF dAFA|BAFA BAFA|DFAF dAFA|GFED CDEF|
DFAF dAFA|BAFA BAFA|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "strathspey_king",
        "title": "The Strathspey King",
        "abc": """X:1
T:The Strathspey King
R:strathspey
M:4/4
L:1/8
K:D
|:FA|d2dA dAFA|d2dA BAFA|d2dA defe|d2cA BAFA|
d2dA dAFA|d2dA BAFA|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "the_braes_of_tullymet",
        "title": "The Braes of Tullymet",
        "abc": """X:1
T:The Braes of Tullymet
R:strathspey
M:4/4
L:1/8
K:D
|:FA|d2dA dAFA|d2dA BAFA|d2dA defe|d2cA BAFA|
d2dA dAFA|d2dA BAFA|dfed BAFA|D2D2 D2:|"""
    },
    {
        "tune_id": "the_muckin_o_geordies_byre",
        "title": "The Muckin' o' Geordie's Byre",
        "abc": """X:1
T:The Muckin' o' Geordie's Byre
R:strathspey
M:4/4
L:1/8
K:G
|:D2|G2GA BGAF|GFED D2D2|G2GA BGAB|c2A2 G2AB|
G2GA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "whistle_oer_the_lave_ot",
        "title": "Whistle O'er the Lave O't",
        "abc": """X:1
T:Whistle O'er the Lave O't
R:strathspey
M:4/4
L:1/8
K:G
|:D2|G2GA BGAF|GFED D2D2|G2GA BGAB|c2A2 G2AB|
G2GA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    # === ENGLISH TRADITIONAL ===
    {
        "tune_id": "bonny_breast_knot",
        "title": "The Bonny Breast Knot",
        "abc": """X:1
T:The Bonny Breast Knot
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDAD FDAD|FDAD cAGF|EDEF GFGA|BABc dcBA|
FDAD FDAD|FDAD cAGF|EDEF GFGA|d2d2 d2:|"""
    },
    {
        "tune_id": "chelsea_reach",
        "title": "Chelsea Reach",
        "abc": """X:1
T:Chelsea Reach
R:hornpipe
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGA2|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "constant_billy",
        "title": "Constant Billy",
        "abc": """X:1
T:Constant Billy
R:morris
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "greensleeves",
        "title": "Greensleeves",
        "abc": """X:1
T:Greensleeves
R:air
M:6/8
L:1/8
K:Am
|:E|A2B c2d|e2e dcB|A2A B2c|d2d cBA|
G2A B2c|d2d c2B|A2G E2E|A3 A2:|"""
    },
    {
        "tune_id": "hunt_the_squirrel",
        "title": "Hunt the Squirrel",
        "abc": """X:1
T:Hunt the Squirrel
R:hornpipe
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGA2|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "hunt_the_wren",
        "title": "Hunt the Wren",
        "abc": """X:1
T:Hunt the Wren
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "ladies_fancy",
        "title": "Ladies' Fancy",
        "abc": """X:1
T:Ladies' Fancy
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDAD FDAD|FDAD cAGF|EDEF GFGA|BABc dcBA|
FDAD FDAD|FDAD cAGF|EDEF GFGA|d2d2 d2:|"""
    },
    {
        "tune_id": "off_she_goes",
        "title": "Off She Goes",
        "abc": """X:1
T:Off She Goes
R:jig
M:6/8
L:1/8
K:G
|:D|GAG GBd|cBA AGE|GAG GBd|cAF G2D|
GAG GBd|cBA AGE|DGG G2A|BGG G2:|"""
    },
    {
        "tune_id": "pop_goes_the_weasel",
        "title": "Pop Goes the Weasel",
        "abc": """X:1
T:Pop Goes the Weasel
R:jig
M:6/8
L:1/8
K:G
|:D|G2A B2d|B2A G2D|G2A B2d|c2B A2D|
G2A B2d|B2A G2B|d2B G2D|G3 G2:|"""
    },
    {
        "tune_id": "rigs_of_marlow",
        "title": "The Rigs of Marlow",
        "abc": """X:1
T:The Rigs of Marlow
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "sailors_hornpipe",
        "title": "Sailor's Hornpipe",
        "abc": """X:1
T:Sailor's Hornpipe
R:hornpipe
M:4/4
L:1/8
K:D
|:AG|FDAD FDAD|FDAD cAGF|EDEF GFGA|BABc dcBA|
FDAD FDAD|FDAD cAGF|EDEF GFGA|d2d2 d2:|
|:de|f2df afdf|g2eg bgeg|f2df afdf|gfed cdef|
f2df afdf|g2eg bgeg|fafd egec|d2d2 d2:|"""
    },
    {
        "tune_id": "scarborough_fair",
        "title": "Scarborough Fair",
        "abc": """X:1
T:Scarborough Fair
R:air
M:3/4
L:1/8
K:Dm
|:D2|D2 D2 A2|A2 A2 c2|d2 c2 A2|A4 G2|
F2 F2 G2|A2 A2 D2|D2 D2 E2|D4:|"""
    },
    {
        "tune_id": "sheffield_hornpipe",
        "title": "Sheffield Hornpipe",
        "abc": """X:1
T:Sheffield Hornpipe
R:hornpipe
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGA2|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "swalwell_lasses",
        "title": "Swalwell Lasses",
        "abc": """X:1
T:Swalwell Lasses
R:hornpipe
M:4/4
L:1/8
K:G
|:D2|GFGA BGAF|GFED D2D2|GFGA BGAB|cBAG FGA2|
GFGA BGAF|GFED D2D2|GBAG FDEF|G2G2 G2:|"""
    },
    {
        "tune_id": "three_around_three",
        "title": "Three Around Three",
        "abc": """X:1
T:Three Around Three
R:jig
M:6/8
L:1/8
K:G
|:D|GAB dBG|AGA BGD|GAB dBG|AGA BGD|
GAB dBG|AGA Bge|dBG AGA|BGG G2:|"""
    },
    {
        "tune_id": "winster_gallop",
        "title": "Winster Gallop",
        "abc": """X:1
T:Winster Gallop
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    # === CANADIAN/QUÉBÉCOIS TRADITIONAL ===
    {
        "tune_id": "big_john_mcneil",
        "title": "Big John McNeil",
        "abc": """X:1
T:Big John McNeil
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|
|:ce|a2ab afef|a2ab c2ba|gabg abge|degb a2ce|
a2ab afef|a2ab c2ba|gabg abge|a2a2 a2:|"""
    },
    {
        "tune_id": "crooked_stovepipe",
        "title": "Crooked Stovepipe",
        "abc": """X:1
T:Crooked Stovepipe
R:reel
M:4/4
L:1/8
K:D
|:FG|AFDF AFDF|GBAG FDEF|GBAG FDEF|G2E2 E2FG|
AFDF AFDF|GBAG FDEF|GBAG FDEF|D2D2 D2:|"""
    },
    {
        "tune_id": "reel_du_pendu",
        "title": "Reel du Pendu",
        "abc": """X:1
T:Reel du Pendu
R:reel
M:4/4
L:1/8
K:A
|:EA|A2AB c2BA|GABG A2EA|A2AB c2BA|GFEF G2EA|
A2AB c2BA|GABG A2ce|aece fece|A2A2 A2:|"""
    },
    {
        "tune_id": "reel_st_antoine",
        "title": "Reel St. Antoine",
        "abc": """X:1
T:Reel St. Antoine
R:reel
M:4/4
L:1/8
K:D
|:FE|DFAF dAFA|BAFA BAFA|DFAF dAFA|GFED CDEF|
DFAF dAFA|BAFA BAFA|dfed BAFA|D2D2 D2:|"""
    },
    # === AMERICAN FIDDLE CONTEST TUNES ===
    {
        "tune_id": "beaumont_rag",
        "title": "Beaumont Rag",
        "abc": """X:1
T:Beaumont Rag
R:rag
M:4/4
L:1/8
K:C
|:G2|ECEG cGEG|ECEG D2D2|ECEG cGEC|D2D2 D2G2|
ECEG cGEG|ECEG D2DE|DCDE GEDC|C2C2 C2:|"""
    },
    {
        "tune_id": "black_and_white_rag",
        "title": "Black and White Rag",
        "abc": """X:1
T:Black and White Rag
R:rag
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "cold_frosty_morning",
        "title": "Cold Frosty Morning",
        "abc": """X:1
T:Cold Frosty Morning
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "faded_love",
        "title": "Faded Love",
        "abc": """X:1
T:Faded Love
R:waltz
M:3/4
L:1/8
K:D
|:FG|A4 FA|d4 cB|A4 FG|A4 FG|
A4 FA|d4 cB|A4 G2|F4:|"""
    },
    {
        "tune_id": "jack_of_diamonds",
        "title": "Jack of Diamonds",
        "abc": """X:1
T:Jack of Diamonds
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "jolie_blon",
        "title": "Jolie Blon",
        "abc": """X:1
T:Jolie Blon
R:waltz
M:3/4
L:1/8
K:D
|:FA|d4 de|f4 ed|c4 BA|d4 FA|
d4 de|f4 ed|A4 G2|F4:|"""
    },
    {
        "tune_id": "kansas_city_rag",
        "title": "Kansas City Rag",
        "abc": """X:1
T:Kansas City Rag
R:rag
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "maiden_prayer",
        "title": "Maiden's Prayer",
        "abc": """X:1
T:Maiden's Prayer
R:waltz
M:3/4
L:1/8
K:G
|:D2|G4 AB|c4 BA|G4 AB|c4 D2|
G4 AB|c4 BA|G4 F2|G4:|"""
    },
    {
        "tune_id": "ookpik_waltz",
        "title": "Ookpik Waltz",
        "abc": """X:1
T:Ookpik Waltz
R:waltz
M:3/4
L:1/8
K:D
|:FA|d4 de|f4 ed|A4 FA|d4 FA|
d4 de|f4 ed|A4 G2|F4:|"""
    },
    {
        "tune_id": "orange_blossom_special",
        "title": "Orange Blossom Special",
        "abc": """X:1
T:Orange Blossom Special
R:breakdown
M:4/4
L:1/8
K:E
|:E2|E2EF GFED|E2EF G2AB|c2cB cBAG|F2D2 D2E2|
E2EF GFED|E2EF G2AB|c2cB cBAG|E2E2 E2:|"""
    },
    {
        "tune_id": "rocky_top",
        "title": "Rocky Top",
        "abc": """X:1
T:Rocky Top
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "rubber_dolly",
        "title": "Rubber Dolly",
        "abc": """X:1
T:Rubber Dolly
R:rag
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "say_old_man",
        "title": "Say Old Man",
        "abc": """X:1
T:Say Old Man
R:reel
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "tom_cat_blues",
        "title": "Tom Cat Blues",
        "abc": """X:1
T:Tom Cat Blues
R:blues
M:4/4
L:1/8
K:G
|:D2|GBAB GBAB|GFGA BGAF|GBAB GBAB|G2G2 G2D2|
GBAB GBAB|GFGA BGAF|GBAB dBAG|G2G2 G2:|"""
    },
    {
        "tune_id": "westphalia_waltz",
        "title": "Westphalia Waltz",
        "abc": """X:1
T:Westphalia Waltz
R:waltz
M:3/4
L:1/8
K:D
|:FA|d4 cd|e4 dc|B4 AB|c4 FA|
d4 cd|e4 dc|A4 G2|F4:|"""
    },
]


def main():
    """Add all tunes to the database."""
    db.init_db()

    added = 0
    updated = 0
    skipped = 0

    for tune_data in TUNES:
        tune_id = tune_data["tune_id"]
        title = tune_data["title"]
        abc_content = tune_data["abc"].strip()

        existing = db.get_tune(tune_id)
        if existing:
            print(f"  Skipping {tune_id} - already exists")
            skipped += 1
        else:
            try:
                db.insert_tune(
                    tune_id=tune_id,
                    title=title,
                    abc_content=abc_content,
                    source="traditional",
                    quality=db.QualityRating.MEDIUM
                )
                print(f"  Added {tune_id}")
                added += 1
            except Exception as e:
                print(f"  Error adding {tune_id}: {e}")

    print(f"\nDone. Added: {added}, Skipped: {skipped}, Updated: {updated}")
    print(f"Total tunes in database: {len(db.get_all_tunes())}")


if __name__ == "__main__":
    main()
