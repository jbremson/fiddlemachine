#!/usr/bin/env python3
"""
Update tunes in the database with source URLs from The Session.

The Session (thesession.org) is a community database of traditional Irish music
with tune IDs that can be linked directly.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend import database as db

# Mapping of tune_id to The Session tune number
# These are well-known traditional tunes with entries on thesession.org
SESSION_URLS = {
    # Irish Traditional
    "banish_misfortune": 58,
    "boys_of_bluehill": 233,
    "blarney_pilgrim": 325,
    "cooleys_reel": 1,
    "cup_of_tea": 46,
    "drowsy_maggie": 84,
    "eavesdropper": 2257,
    "farewell_to_ireland": 445,
    "foggy_dew": 1646,
    "gravel_walk": 141,
    "humours_of_tulla": 1287,
    "irish_washerwoman": 2382,
    "kerry_polka": 365,
    "kid_on_the_mountain": 78,
    "lark_in_the_morning": 246,
    "lilting_banshee": 191,
    "maid_behind_the_bar": 68,
    "mason_apron": 167,
    "merrily_kiss_the_quaker": 429,
    "mist_covered_mountains": 1638,
    "morrisons_jig": 192,
    "mountain_road": 88,
    "out_on_the_ocean": 149,
    "rights_of_man": 129,
    "roisin_dubh": 2115,
    "sally_gardens": 1195,
    "swallowtail_jig": 43,
    "tenpenny_bit": 69,
    "the_butterfly": 3,
    "the_kesh": 95,
    "wind_that_shakes_the_barley": 107,
    "tar bolton": 161,
    "tarbolton": 161,
    "star_of_munster": 217,
    "flogging_reel": 2130,
    "concertina_reel": 109,
    "trip_to_sligo": 4304,
    "galway_rambler": 2543,
    "glass_of_beer": 1621,
    "green_groves_of_erin": 1127,
    "killavil_jig": 4149,
    "maids_of_mitchelstown": 1234,
    "monaghan_jig": 583,
    "mulhaires": 2276,
    "oconnors": 1852,
    "planxty_irwin": 2131,
    "rambling_pitchfork": 1103,
    "rollicking_irishman": 1579,
    "rose_in_the_heather": 1106,
    "tom_billys_jig": 847,
    "trip_to_durrow": 2556,
    "dinny_obriens": 1893,
    "college_groves": 2342,
    "bucks_of_oranmore": 44,
    "boys_of_ballymote": 1190,
    "blackthorn_stick": 1143,
    "fairies_hornpipe": 753,
    "john_ryans_polka": 2207,
    "king_of_the_fairies": 106,
    "merry_blacksmith": 62,
    "star_of_county_down": 2366,
    "tam_lin": 2468,
    "haste_to_the_wedding": 371,
    "rocky_road_to_dublin": 414,

    # Scottish Traditional
    "atholl_highlanders": 1655,
    "brose_and_butter": 1791,
    "flowers_of_edinburgh": 397,
    "fairy_dance": 3012,
    "miss_mcleods_reel": 541,
    "monymusk": 1656,
    "rakes_of_mallow": 293,

    # Old-Time American (some have Session entries)
    "arkansas_traveler": 2573,
    "billy_in_the_lowground": 3167,
    "blackberry_blossom": 2355,
    "brilliancy": 4026,
    "cluck_old_hen": 4820,
    "cotton_eyed_joe": 3798,
    "devils_dream": 1557,
    "dusty_miller": 1652,
    "fisher_hornpipe": 540,
    "forked_deer": 3476,
    "golden_slippers": 3779,
    "harvest_home": 2360,
    "june_apple": 4817,
    "leather_britches": 3179,
    "liberty": 4816,
    "miss_mcleods_reel": 541,
    "money_musk": 1584,
    "old_joe_clark": 3424,
    "over_the_waterfall": 3511,
    "paddy_on_the_turnpike": 245,
    "ragtime_annie": 3494,
    "red_haired_boy": 63,
    "road_to_boston": 3513,
    "sail_away_ladies": 3474,
    "sally_goodin": 3473,
    "salt_creek": 3512,
    "soldiers_joy": 55,
    "sourwood_mountain": 3475,
    "st_annes_reel": 73,
    "sugar_in_the_gourd": 3496,
    "tennessee_wagoner": 4002,
    "turkey_in_the_straw": 3497,
    "whiskey_before_breakfast": 3455,

    # English Traditional
    "greensleeves": 4274,
    "sailors_hornpipe": 540,
    "scarborough_fair": 4389,
    "pop_goes_the_weasel": 3758,
    "off_she_goes": 400,
    "hunt_the_squirrel": 4318,
    "constant_billy": 4501,

    # Other well-known
    "angeline_the_baker": 4819,
    "cripple_creek": 3177,
    "fire_on_the_mountain": 3495,
    "gray_eagle": 3510,
    "kitchen_girl": 4811,
    "squirrel_hunters": 4818,
    "big_john_mcneil": 3159,
}


def main():
    """Update tunes with source URLs."""
    db.init_db()

    updated = 0
    not_found = 0

    for tune_id, session_id in SESSION_URLS.items():
        url = f"https://thesession.org/tunes/{session_id}"

        existing = db.get_tune(tune_id)
        if existing:
            db.update_tune(
                tune_id,
                source="thesession.org",
                source_url=url,
                increment_version=False
            )
            print(f"  Updated {tune_id} -> {url}")
            updated += 1
        else:
            print(f"  Not found: {tune_id}")
            not_found += 1

    print(f"\nDone. Updated: {updated}, Not found: {not_found}")


if __name__ == "__main__":
    main()
