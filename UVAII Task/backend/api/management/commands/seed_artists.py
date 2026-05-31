"""
Seed command: populates 6 ArtStage artists covering all disciplines.
Run: python manage.py seed_artists
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from api.models import (
    Talent, ArtistProfile, Credit, UnionAffiliation,
    Reel, ReelStats, ArtStagePost, PostStats, LiveStream, AvailabilityWindow,
)

VIDEO_PLACEHOLDER = 'https://www.w3schools.com/html/mov_bbb.mp4'

ARTISTS = [
    {
        'talent': {
            'id': 'artist-maya-okonkwo',
            'name': 'Maya Okonkwo',
            'category': 'Actor',
            'avatar': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
            'verified': True,
            'location': 'New York, NY',
            'followers': 14800,
            'bio': 'Union actor specializing in drama and physical theatre. Trained at Juilliard. Represented by CAA.',
            'agency': 'CAA',
        },
        'profile': {
            'username': 'maya-okonkwo',
            'primary_discipline': 'actor',
            'secondary_disciplines': ['presenter'],
            'pronouns': 'she/her',
            'tagline': 'Drama. Physicality. Truth.',
            'playable_age_min': 22,
            'playable_age_max': 35,
            'identity_verified': True,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop', 'alt': 'Maya Okonkwo headshot', 'width': 400, 'height': 400},
                {'url': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', 'alt': 'Maya Okonkwo commercial headshot', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=675&fit=crop', 'alt': 'Stage performance', 'width': 1200, 'height': 675},
            'representation': {'agency': 'CAA', 'agent': 'Dana Schwartz', 'type': 'theatrical'},
            'following_count': 230,
        },
        'credits': [
            {'title': 'Succession', 'role': 'Andrea Cross', 'year': 2023, 'production_type': 'TV', 'billing': 'Guest Star', 'director': 'Mark Mylod', 'producing_entity': 'HBO', 'verification': 'verified', 'verified_by': 'HBO'},
            {'title': 'A Raisin in the Sun', 'role': 'Beneatha Younger', 'year': 2022, 'production_type': 'Theater', 'billing': 'Lead', 'director': 'Phylicia Rashad', 'producing_entity': 'Roundabout Theatre', 'verification': 'verified', 'verified_by': 'Roundabout Theatre'},
            {'title': 'The Forty-Year-Old Version', 'role': 'Ensemble', 'year': 2021, 'production_type': 'Film', 'billing': 'Supporting', 'director': 'Radha Blank', 'producing_entity': 'Netflix', 'verification': 'verified', 'verified_by': 'Netflix'},
            {'title': 'Law & Order: SVU', 'role': 'Detective Keane', 'year': 2021, 'production_type': 'TV', 'billing': 'Recurring', 'producing_entity': 'NBC', 'verification': 'verified', 'verified_by': 'Universal TV'},
            {'title': 'Topdog/Underdog', 'role': 'Grace', 'year': 2020, 'production_type': 'Theater', 'billing': 'Lead', 'director': 'Kenny Leon', 'producing_entity': 'Second Stage', 'verification': 'verified', 'verified_by': 'Second Stage Theater'},
            {'title': 'New Amsterdam', 'role': 'Dr. Reyes', 'year': 2020, 'production_type': 'TV', 'billing': 'Co-Star', 'producing_entity': 'NBC', 'verification': 'pending'},
            {'title': 'The Burial at Thebes', 'role': 'Antigone', 'year': 2019, 'production_type': 'Theater', 'billing': 'Lead', 'verification': 'self_asserted'},
            {'title': 'Motherless Brooklyn', 'role': 'Receptionist', 'year': 2019, 'production_type': 'Film', 'billing': 'Day Player', 'verification': 'self_asserted'},
        ],
        'unions': [
            {'union': 'SAG-AFTRA', 'status': 'active', 'joined_year': 2018, 'verification': 'verified'},
            {'union': 'Equity', 'status': 'active', 'joined_year': 2018, 'verification': 'verified'},
        ],
        'reels': [
            {'title': 'Drama Reel 2024', 'type': 'reel', 'duration': 87, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'actor', 'language': 'English', 'accent': 'Standard American'}, 'plays': 8420, 'likes': 612, 'saves': 89},
            {'title': 'Succession — Guest Appearance', 'type': 'monologue', 'duration': 45, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'actor', 'language': 'English', 'source_material': 'Succession S4E3'}, 'plays': 3200, 'likes': 244, 'saves': 31},
            {'title': 'Juilliard Showcase Monologue', 'type': 'monologue', 'duration': 62, 'featured': False, 'visibility': 'platform_only', 'metadata': {'kind': 'actor', 'language': 'English', 'source_material': 'August Wilson'}, 'plays': 1100, 'likes': 98, 'saves': 14},
            {'title': 'Commercial Reel', 'type': 'reel', 'duration': 55, 'featured': False, 'visibility': 'industry_only', 'metadata': {'kind': 'actor', 'language': 'English'}, 'plays': 780, 'likes': 43, 'saves': 7},
            {'title': 'Physical Theatre — Devised Work', 'type': 'reel', 'duration': 38, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'actor', 'language': 'English'}, 'plays': 2100, 'likes': 187, 'saves': 22},
            {'title': 'Dialect Reel (6 Accents)', 'type': 'monologue', 'duration': 72, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'actor', 'language': 'English', 'accent': 'Multiple'}, 'plays': 4300, 'likes': 390, 'saves': 55},
        ],
        'posts': [
            {'content': 'Just wrapped on a new short film with the Brooklyn Youth Chorus. Cannot wait to share more. Grateful for every room I get to walk into.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 312, 'comments': 28},
            {'content': 'Callbacks are tomorrow. Sending good vibes to everyone in the waiting room with me. You prepared. Trust that.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 187, 'comments': 14},
        ],
        'live': {'title': 'Q&A — Preparing for Pilot Season', 'is_live': True, 'viewer_count': 342},
        'availability': [
            {'state': 'available', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=14), 'willing_to_travel': True, 'travel_radius': 200},
            {'state': 'booked', 'start_date': date.today() + timedelta(days=15), 'end_date': date.today() + timedelta(days=30), 'willing_to_travel': False, 'note': 'Film shoot in Atlanta'},
            {'state': 'tentative', 'start_date': date.today() + timedelta(days=31), 'end_date': date.today() + timedelta(days=50), 'willing_to_travel': True},
            {'state': 'available', 'start_date': date.today() + timedelta(days=51), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': True},
        ],
    },
    {
        'talent': {
            'id': 'artist-theo-reyes',
            'name': 'Theo Reyes',
            'category': 'Singer',
            'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
            'verified': True,
            'location': 'Los Angeles, CA',
            'followers': 28400,
            'bio': 'Mezzo-baritone. Jazz and musical theatre vocalist. Recording artist. Latest album "Nightshift" out now.',
            'agency': 'Paradigm',
        },
        'profile': {
            'username': 'theo-reyes',
            'primary_discipline': 'singer',
            'secondary_disciplines': ['musician'],
            'pronouns': 'he/him',
            'tagline': 'Mezzo-baritone. Jazz. Musical theatre.',
            'playable_age_min': 28,
            'playable_age_max': 45,
            'identity_verified': True,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 'alt': 'Theo Reyes portrait', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=675&fit=crop', 'alt': 'Concert stage', 'width': 1200, 'height': 675},
            'representation': {'agency': 'Paradigm', 'agent': 'Michelle Torres', 'type': 'music'},
            'following_count': 510,
        },
        'credits': [
            {'title': 'Sunday in the Park with George', 'role': 'George', 'year': 2023, 'production_type': 'Theater', 'billing': 'Lead', 'producing_entity': 'LA Opera', 'verification': 'verified', 'verified_by': 'LA Opera'},
            {'title': 'Nightshift', 'role': 'Lead Artist', 'year': 2023, 'production_type': 'Album', 'producing_entity': 'Blue Note Records', 'verification': 'verified', 'verified_by': 'Blue Note Records'},
            {'title': 'Company', 'role': 'Bobby', 'year': 2022, 'production_type': 'Theater', 'billing': 'Lead', 'producing_entity': 'Ahmanson Theatre', 'verification': 'verified', 'verified_by': 'Center Theatre Group'},
            {'title': 'Jazz at Lincoln Center', 'role': 'Featured Artist', 'year': 2022, 'production_type': 'Concert', 'producing_entity': 'Jazz at Lincoln Center', 'verification': 'verified'},
            {'title': 'Sweeney Todd', 'role': 'Sweeney Todd', 'year': 2021, 'production_type': 'Theater', 'billing': 'Lead', 'producing_entity': 'Pasadena Playhouse', 'verification': 'verified', 'verified_by': 'Pasadena Playhouse'},
            {'title': 'Between the Lines', 'role': 'Composer/Performer', 'year': 2020, 'production_type': 'Album', 'verification': 'self_asserted'},
        ],
        'unions': [
            {'union': 'Equity', 'status': 'active', 'joined_year': 2015, 'verification': 'verified'},
            {'union': 'AGMA', 'status': 'active', 'joined_year': 2017, 'verification': 'verified'},
            {'union': 'AFM', 'status': 'active', 'joined_year': 2016, 'verification': 'pending'},
        ],
        'reels': [
            {'title': '"Finishing the Hat" — Sondheim', 'type': 'song', 'duration': 180, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'singer', 'song_title': 'Finishing the Hat', 'key': 'E major', 'genre': 'Musical Theatre'}, 'plays': 12300, 'likes': 1840, 'saves': 290},
            {'title': '"Round Midnight" — Thelonious Monk', 'type': 'song', 'duration': 210, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'singer', 'song_title': "Round Midnight", 'genre': 'Jazz'}, 'plays': 7800, 'likes': 932, 'saves': 115},
            {'title': '"Cry Me a River" — Live at Lincoln Center', 'type': 'song', 'duration': 195, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'singer', 'song_title': 'Cry Me a River', 'genre': 'Jazz'}, 'plays': 5400, 'likes': 620, 'saves': 88},
            {'title': 'Original: "Nightshift" Title Track', 'type': 'song', 'duration': 240, 'featured': False, 'visibility': 'industry_only', 'metadata': {'kind': 'singer', 'song_title': 'Nightshift', 'genre': 'Jazz/R&B'}, 'plays': 2100, 'likes': 340, 'saves': 61},
            {'title': 'Vocal Range Demo', 'type': 'reel', 'duration': 65, 'featured': False, 'visibility': 'platform_only', 'metadata': {'kind': 'singer', 'song_title': 'Range Demonstration', 'genre': 'Mixed'}, 'plays': 890, 'likes': 76, 'saves': 18},
        ],
        'posts': [
            {'content': '"Nightshift" is officially streaming everywhere. This album took three years and a lot of late nights. Thank you to everyone who believed in it. Link in bio.', 'visibility': 'public', 'featured': False, 'pinned': True, 'likes': 2140, 'comments': 184},
            {'content': 'Master class in musical theatre singing at UCLA this weekend. If you\'re a student looking to grow — come through. DM for details.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 543, 'comments': 47},
            {'content': 'The Ahmanson run of Company was everything. Grateful for every night we had on that stage.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 780, 'comments': 63},
        ],
        'live': None,
        'availability': [
            {'state': 'unavailable', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=20), 'willing_to_travel': False, 'note': 'Album press tour'},
            {'state': 'available', 'start_date': date.today() + timedelta(days=21), 'end_date': date.today() + timedelta(days=60), 'willing_to_travel': True},
            {'state': 'tentative', 'start_date': date.today() + timedelta(days=61), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': True, 'note': 'Potential Equity tour'},
        ],
    },
    {
        'talent': {
            'id': 'artist-aria-lindqvist',
            'name': 'Aria Lindqvist',
            'category': 'Dancer',
            'avatar': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
            'verified': True,
            'location': 'Chicago, IL',
            'followers': 9200,
            'bio': 'Contemporary and ballet dancer. Company member at Hubbard Street Dance Chicago. Choreographer.',
        },
        'profile': {
            'username': 'aria-lindqvist',
            'primary_discipline': 'dancer',
            'secondary_disciplines': [],
            'pronouns': 'she/they',
            'tagline': 'Contemporary. Ballet. Company Member, Hubbard Street.',
            'playable_age_min': 18,
            'playable_age_max': 30,
            'identity_verified': True,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', 'alt': 'Aria Lindqvist dance portrait', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1200&h=675&fit=crop', 'alt': 'Dance performance', 'width': 1200, 'height': 675},
            'representation': None,
            'following_count': 145,
        },
        'credits': [
            {'title': 'Archipelago', 'role': 'Principal Dancer', 'year': 2024, 'production_type': 'Dance', 'billing': 'Lead', 'producing_entity': 'Hubbard Street Dance Chicago', 'verification': 'verified', 'verified_by': 'Hubbard Street'},
            {'title': 'Season Program 2023', 'role': 'Company Dancer', 'year': 2023, 'production_type': 'Dance', 'producing_entity': 'Hubbard Street Dance Chicago', 'verification': 'verified', 'verified_by': 'Hubbard Street'},
            {'title': 'Emergence (World Premiere)', 'role': 'Soloist', 'year': 2022, 'production_type': 'Dance', 'billing': 'Featured', 'producing_entity': 'Chicago Dancemakers Forum', 'verification': 'verified', 'verified_by': 'Chicago Dancemakers Forum'},
            {'title': 'Nutcracker', 'role': 'Dewdrop', 'year': 2021, 'production_type': 'Ballet', 'billing': 'Soloist', 'producing_entity': 'Joffrey Ballet', 'verification': 'pending'},
        ],
        'unions': [
            {'union': 'AGMA', 'status': 'active', 'joined_year': 2020, 'verification': 'verified'},
        ],
        'reels': [
            {'title': 'Archipelago — Solo Excerpt', 'type': 'dance', 'duration': 95, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'dancer', 'style': 'Contemporary', 'choreographer': 'Alejandro Cerrudo'}, 'plays': 6700, 'likes': 810, 'saves': 134},
            {'title': 'Contemporary Technique Reel 2024', 'type': 'dance', 'duration': 78, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'dancer', 'style': 'Contemporary'}, 'plays': 4200, 'likes': 490, 'saves': 71},
            {'title': 'Ballet Variations', 'type': 'dance', 'duration': 120, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'dancer', 'style': 'Classical Ballet'}, 'plays': 3100, 'likes': 320, 'saves': 45},
            {'title': 'Choreography — Original Work', 'type': 'dance', 'duration': 145, 'featured': False, 'visibility': 'industry_only', 'metadata': {'kind': 'dancer', 'style': 'Contemporary/Improvisation', 'choreographer': 'Aria Lindqvist'}, 'plays': 890, 'likes': 77, 'saves': 19},
        ],
        'posts': [
            {'content': 'Opening night of Archipelago was everything. The audience\'s silence during the second movement meant more than any applause.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 423, 'comments': 31},
        ],
        'live': None,
        'availability': [
            {'state': 'booked', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=10), 'willing_to_travel': True, 'note': 'Hubbard Street Spring Season'},
            {'state': 'available', 'start_date': date.today() + timedelta(days=11), 'end_date': date.today() + timedelta(days=25), 'willing_to_travel': True, 'travel_radius': 500},
            {'state': 'tentative', 'start_date': date.today() + timedelta(days=26), 'end_date': date.today() + timedelta(days=40), 'willing_to_travel': False},
            {'state': 'available', 'start_date': date.today() + timedelta(days=41), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': True},
        ],
    },
    {
        'talent': {
            'id': 'artist-devon-park',
            'name': 'Devon Park',
            'category': 'Musician',
            'avatar': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
            'verified': False,
            'location': 'Nashville, TN',
            'followers': 6700,
            'bio': 'Multi-instrumentalist. Session guitarist, keys, and bass. 15+ studio credits across country, Americana, and film scoring.',
        },
        'profile': {
            'username': 'devon-park',
            'primary_discipline': 'musician',
            'secondary_disciplines': [],
            'pronouns': 'he/him',
            'tagline': 'Session musician. Guitar, keys, bass. Nashville.',
            'playable_age_min': 25,
            'playable_age_max': 40,
            'identity_verified': False,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', 'alt': 'Devon Park portrait', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=675&fit=crop', 'alt': 'Recording studio', 'width': 1200, 'height': 675},
            'representation': None,
            'following_count': 88,
        },
        'credits': [
            {'title': 'Lacy Grove — "Wildfire"', 'role': 'Session Guitarist', 'year': 2024, 'production_type': 'Album', 'producing_entity': 'Republic Records', 'verification': 'verified', 'verified_by': 'Republic Records'},
            {'title': 'Feature Film Score — "Hollow Ground"', 'role': 'Guitar/Keys', 'year': 2023, 'production_type': 'Film', 'producing_entity': 'A24', 'verification': 'verified', 'verified_by': 'A24'},
            {'title': 'Marcus Hayes — "From Here"', 'role': 'Session Bassist', 'year': 2023, 'production_type': 'Album', 'producing_entity': 'Sony Nashville', 'verification': 'verified', 'verified_by': 'Sony Nashville'},
            {'title': 'Maren Morris Touring Band', 'role': 'Touring Guitarist', 'year': 2022, 'production_type': 'Live/Tour', 'producing_entity': 'WME', 'verification': 'pending'},
            {'title': 'Devon Park — "Undercurrent"', 'role': 'Composer/Performer', 'year': 2022, 'production_type': 'EP', 'verification': 'self_asserted'},
        ],
        'unions': [
            {'union': 'AFM', 'status': 'active', 'joined_year': 2019, 'verification': 'self_asserted'},
        ],
        'reels': [
            {'title': 'Session Guitar — Studio Reel 2024', 'type': 'reel', 'duration': 90, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'musician', 'instrument': 'Guitar', 'genre': 'Country/Americana'}, 'plays': 3200, 'likes': 287, 'saves': 43},
            {'title': '"Undercurrent" — Original Composition', 'type': 'reel', 'duration': 210, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'musician', 'instrument': 'Guitar/Keys/Bass', 'genre': 'Americana'}, 'plays': 1800, 'likes': 154, 'saves': 28},
            {'title': 'Film Score Demo — "Hollow Ground"', 'type': 'reel', 'duration': 75, 'featured': False, 'visibility': 'industry_only', 'metadata': {'kind': 'musician', 'instrument': 'Guitar/Keys', 'genre': 'Film Score'}, 'plays': 620, 'likes': 55, 'saves': 12},
        ],
        'posts': [
            {'content': 'Just wrapped a week of tracking for a record I cannot name yet. Cannot wait for you all to hear this one.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 210, 'comments': 18},
        ],
        'live': None,
        'availability': [
            {'state': 'available', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=7), 'willing_to_travel': True, 'travel_radius': 300},
            {'state': 'tentative', 'start_date': date.today() + timedelta(days=8), 'end_date': date.today() + timedelta(days=21), 'willing_to_travel': True},
            {'state': 'available', 'start_date': date.today() + timedelta(days=22), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': True},
        ],
    },
    {
        'talent': {
            'id': 'artist-jamie-wexler',
            'name': 'Jamie Wexler',
            'category': 'Voice Actor',
            'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
            'verified': True,
            'location': 'Remote (Los Angeles, CA)',
            'followers': 11200,
            'bio': 'Professional voice actor with home studio. Specialising in animation, video games, commercial, and audiobooks. 25+ credits.',
        },
        'profile': {
            'username': 'jamie-wexler',
            'primary_discipline': 'voice_actor',
            'secondary_disciplines': [],
            'pronouns': 'they/them',
            'tagline': 'Animation. Video Games. Commercial. Home studio.',
            'playable_age_min': 20,
            'playable_age_max': 55,
            'identity_verified': True,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', 'alt': 'Jamie Wexler portrait', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=675&fit=crop', 'alt': 'Recording microphone', 'width': 1200, 'height': 675},
            'representation': {'agency': 'CESD Talent Agency', 'agent': 'Rachel Kim', 'type': 'voice'},
            'following_count': 340,
        },
        'credits': [
            {'title': 'Apex Legends', 'role': 'Valkyrie (additional dialogue)', 'year': 2023, 'production_type': 'Video Game', 'producing_entity': 'Respawn/EA', 'verification': 'verified', 'verified_by': 'Respawn Entertainment'},
            {'title': 'Disenchantment', 'role': 'Guard #3 / Villager', 'year': 2023, 'production_type': 'Animation', 'producing_entity': 'Netflix Animation', 'verification': 'verified', 'verified_by': 'Netflix'},
            {'title': '"The Architecture of Loss" Audiobook', 'role': 'Narrator', 'year': 2022, 'production_type': 'Audiobook', 'producing_entity': 'Penguin Audio', 'verification': 'verified', 'verified_by': 'Penguin Random House'},
            {'title': 'Ford — "Built for Tomorrow" Campaign', 'role': 'Voiceover', 'year': 2022, 'production_type': 'Commercial', 'producing_entity': 'JWT New York', 'verification': 'verified', 'verified_by': 'JWT'},
            {'title': 'Hades II (Early Access)', 'role': 'Spirit Merchant', 'year': 2024, 'production_type': 'Video Game', 'producing_entity': 'Supergiant Games', 'verification': 'pending'},
        ],
        'unions': [
            {'union': 'SAG-AFTRA', 'status': 'active', 'joined_year': 2016, 'verification': 'verified'},
        ],
        'reels': [
            {'title': 'Commercial Demo', 'type': 'voice_demo', 'duration': 60, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Commercial'}, 'plays': 5400, 'likes': 430, 'saves': 67},
            {'title': 'Animation Demo', 'type': 'voice_demo', 'duration': 75, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Animation'}, 'plays': 7200, 'likes': 680, 'saves': 112},
            {'title': 'Video Game Demo', 'type': 'voice_demo', 'duration': 80, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Video Game'}, 'plays': 4100, 'likes': 320, 'saves': 58},
            {'title': 'Narration Demo', 'type': 'voice_demo', 'duration': 65, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Narration'}, 'plays': 3300, 'likes': 270, 'saves': 41},
            {'title': 'Audiobook Sample — "The Architecture of Loss"', 'type': 'voice_demo', 'duration': 120, 'featured': False, 'visibility': 'industry_only', 'metadata': {'kind': 'voice_actor', 'category': 'Audiobook'}, 'plays': 1200, 'likes': 98, 'saves': 22},
            {'title': 'Character Voices Demo', 'type': 'voice_demo', 'duration': 90, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Animation'}, 'plays': 2800, 'likes': 230, 'saves': 34},
            {'title': 'Corporate/E-Learning Demo', 'type': 'voice_demo', 'duration': 55, 'featured': False, 'visibility': 'platform_only', 'metadata': {'kind': 'voice_actor', 'category': 'Narration'}, 'plays': 780, 'likes': 52, 'saves': 9},
            {'title': 'Promo/Trailer Demo', 'type': 'voice_demo', 'duration': 45, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'voice_actor', 'category': 'Commercial'}, 'plays': 3900, 'likes': 310, 'saves': 47},
        ],
        'posts': [
            {'content': 'Just hit the booth on a project I\'ve been waiting to announce. More soon. Hint: it involves swords.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 445, 'comments': 38},
            {'content': 'Home studio tip: invest in your acoustic treatment before your microphone. A great mic in a bad room sounds worse than a decent mic in a treated one.', 'visibility': 'platform_only', 'featured': False, 'pinned': False, 'likes': 620, 'comments': 55},
        ],
        'live': None,
        'availability': [
            {'state': 'available', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': False, 'note': 'Remote only — home studio sessions available immediately'},
        ],
    },
    {
        'talent': {
            'id': 'artist-sam-quintero',
            'name': 'Sam Quintero',
            'category': 'Comedian',
            'avatar': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
            'verified': False,
            'location': 'Brooklyn, NY',
            'followers': 4800,
            'bio': 'Standup and sketch comedian. Regular at the Comedy Cellar and Upright Citizens Brigade. Festival alum.',
        },
        'profile': {
            'username': 'sam-quintero',
            'primary_discipline': 'comedian',
            'secondary_disciplines': [],
            'pronouns': 'he/him',
            'tagline': 'Standup. Sketch. UCB. Comedy Cellar.',
            'playable_age_min': 25,
            'playable_age_max': 45,
            'identity_verified': False,
            'headshots': [
                {'url': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop', 'alt': 'Sam Quintero portrait', 'width': 400, 'height': 400},
            ],
            'cover_image': {'url': 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&h=675&fit=crop', 'alt': 'Comedy club stage', 'width': 1200, 'height': 675},
            'representation': None,
            'following_count': 67,
        },
        'credits': [
            {'title': 'Tribeca Comedy Festival', 'role': 'Featured Performer', 'year': 2024, 'production_type': 'Festival', 'producing_entity': 'Tribeca Film Festival', 'verification': 'verified', 'verified_by': 'Tribeca'},
            {'title': 'Clusterfest', 'role': 'Main Stage', 'year': 2023, 'production_type': 'Festival', 'producing_entity': 'Comedy Central', 'verification': 'verified', 'verified_by': 'Comedy Central'},
            {'title': '"Quarter-Life Crisis" — Comedy Special', 'role': 'Creator/Performer', 'year': 2023, 'production_type': 'Special', 'producing_entity': 'Self-produced', 'verification': 'self_asserted'},
            {'title': 'UCB Cagematch Champion', 'role': 'Ensemble', 'year': 2022, 'production_type': 'Competition', 'producing_entity': 'Upright Citizens Brigade', 'verification': 'verified', 'verified_by': 'UCB'},
            {'title': 'New York Comedy Festival', 'role': 'Emerging Comic Showcase', 'year': 2021, 'production_type': 'Festival', 'producing_entity': 'NYCF', 'verification': 'verified'},
            {'title': 'Just for Laughs — New Faces', 'role': 'New Face', 'year': 2022, 'production_type': 'Festival', 'producing_entity': 'Just for Laughs', 'verification': 'pending'},
        ],
        'unions': [],
        'reels': [
            {'title': 'Late Night Standup Set — 8 min', 'type': 'comedy', 'duration': 480, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'comedian', 'format': 'standup'}, 'plays': 8900, 'likes': 1240, 'saves': 190},
            {'title': 'UCB Sketch — "The Interview"', 'type': 'comedy', 'duration': 180, 'featured': True, 'visibility': 'public', 'metadata': {'kind': 'comedian', 'format': 'sketch'}, 'plays': 3400, 'likes': 430, 'saves': 64},
            {'title': 'Tribeca Set Excerpt — 5 min', 'type': 'comedy', 'duration': 300, 'featured': False, 'visibility': 'public', 'metadata': {'kind': 'comedian', 'format': 'standup'}, 'plays': 2100, 'likes': 280, 'saves': 37},
            {'title': 'Improv Cagematch — Best Moments', 'type': 'comedy', 'duration': 210, 'featured': False, 'visibility': 'platform_only', 'metadata': {'kind': 'comedian', 'format': 'improv'}, 'plays': 1200, 'likes': 140, 'saves': 21},
        ],
        'posts': [
            {'content': 'New set at the Cellar on Thursday. Come out. I\'m trying new material and it might bomb spectacularly — which is half the fun.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 187, 'comments': 24},
            {'content': 'Got into the Tribeca Comedy Festival. First time. Still processing.', 'visibility': 'public', 'featured': False, 'pinned': False, 'likes': 923, 'comments': 78},
        ],
        'live': None,
        'availability': [
            {'state': 'available', 'start_date': date.today(), 'end_date': date.today() + timedelta(days=30), 'willing_to_travel': True, 'travel_radius': 150, 'note': 'Available for bookings — contact for rates'},
            {'state': 'tentative', 'start_date': date.today() + timedelta(days=31), 'end_date': date.today() + timedelta(days=60), 'willing_to_travel': True},
            {'state': 'available', 'start_date': date.today() + timedelta(days=61), 'end_date': date.today() + timedelta(days=90), 'willing_to_travel': True},
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed 6 ArtStage artists covering all disciplines.'

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for data in ARTISTS:
            username = data['profile']['username']

            if ArtistProfile.objects.filter(username=username).exists():
                self.stdout.write(f'  Skipping {username} (already exists)')
                skipped_count += 1
                continue

            # Create Talent
            talent_data = data['talent']
            talent, _ = Talent.objects.get_or_create(
                id=talent_data['id'],
                defaults={
                    'name': talent_data['name'],
                    'category': talent_data['category'],
                    'avatar': talent_data['avatar'],
                    'verified': talent_data['verified'],
                    'location': talent_data['location'],
                    'followers': talent_data['followers'],
                    'bio': talent_data['bio'],
                    'agency': talent_data.get('agency', ''),
                }
            )

            # Create ArtistProfile
            profile_data = data['profile'].copy()
            profile_data.pop('username')
            profile = ArtistProfile.objects.create(
                talent=talent,
                username=username,
                **profile_data,
            )

            # Credits
            for c in data['credits']:
                credit = Credit.objects.create(talent=talent, **c)

            # Union affiliations
            for u in data['unions']:
                UnionAffiliation.objects.create(talent=talent, **u)

            # Reels
            for r in data['reels']:
                reel_data = {k: v for k, v in r.items() if k not in ('plays', 'likes', 'saves')}
                reel = Reel.objects.create(
                    artist=talent,
                    video_url=VIDEO_PLACEHOLDER,
                    thumbnail_url=talent_data['avatar'],
                    has_captions=False,
                    **reel_data,
                )
                ReelStats.objects.create(reel=reel, plays=r['plays'], likes=r['likes'], saves=r['saves'])

            # Posts
            for p in data['posts']:
                post_data = {k: v for k, v in p.items() if k not in ('likes', 'comments', 'saves')}
                post = ArtStagePost.objects.create(artist=talent, **post_data)
                PostStats.objects.create(post=post, likes=p['likes'], comments=p['comments'], saves=0)

            # Live stream
            if data.get('live'):
                LiveStream.objects.create(
                    artist=talent,
                    title=data['live']['title'],
                    is_live=data['live']['is_live'],
                    viewer_count=data['live']['viewer_count'],
                    visibility='public',
                )

            # Availability windows
            for a in data['availability']:
                AvailabilityWindow.objects.create(artist=talent, **a)

            self.stdout.write(self.style.SUCCESS(f'  Created {username}'))
            created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created {created_count} artists, skipped {skipped_count}.'
        ))
