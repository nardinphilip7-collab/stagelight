import type { Artist, Reel, Post, LiveStream, AvailabilityWindow } from './types';

const VIDEO = 'https://www.w3schools.com/html/mov_bbb.mp4';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ─────────────────────────── Maya Okonkwo — Actor ────────────────────────────

export const mayaOkonkwo: Artist = {
  id: 'artist-maya-okonkwo',
  username: 'maya-okonkwo',
  stageName: 'Maya Okonkwo',
  pronouns: 'she/her',
  tagline: 'Drama. Physicality. Truth.',
  location: 'New York, NY',
  playableAgeRange: [22, 35],
  primaryDiscipline: 'actor',
  secondaryDisciplines: ['presenter'],
  identityVerified: true,
  avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
  unionAffiliations: [
    { id: 'u1', union: 'SAG-AFTRA', status: 'active', joinedYear: 2018, verification: 'verified' },
    { id: 'u2', union: 'Equity', status: 'active', joinedYear: 2018, verification: 'verified' },
  ],
  representation: { agency: 'CAA', agent: 'Dana Schwartz', type: 'theatrical' },
  headshots: [
    { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop', alt: 'Maya Okonkwo — primary headshot', width: 600, height: 600 },
    { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop', alt: 'Maya Okonkwo — commercial headshot', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=675&fit=crop', alt: 'Stage performance', width: 1200, height: 675 },
  stats: { followers: 14800, following: 230, reels: 6, verifiedCredits: 5 },
  bio: 'Union actor specializing in drama and physical theatre. Trained at Juilliard. Represented by CAA. Currently in development on an original play with the Atlantic Theater Company.',
  credits: [
    { id: 'c1', title: 'Succession', role: 'Andrea Cross', year: 2023, productionType: 'TV', billing: 'Guest Star', director: 'Mark Mylod', producingEntity: 'HBO', verification: 'verified', verifiedBy: 'HBO' },
    { id: 'c2', title: 'A Raisin in the Sun', role: 'Beneatha Younger', year: 2022, productionType: 'Theater', billing: 'Lead', director: 'Phylicia Rashad', producingEntity: 'Roundabout Theatre', verification: 'verified', verifiedBy: 'Roundabout Theatre' },
    { id: 'c3', title: 'The Forty-Year-Old Version', role: 'Ensemble', year: 2021, productionType: 'Film', billing: 'Supporting', director: 'Radha Blank', producingEntity: 'Netflix', verification: 'verified', verifiedBy: 'Netflix' },
    { id: 'c4', title: 'Law & Order: SVU', role: 'Detective Keane', year: 2021, productionType: 'TV', billing: 'Recurring', producingEntity: 'NBC', verification: 'verified', verifiedBy: 'Universal TV' },
    { id: 'c5', title: 'Topdog/Underdog', role: 'Grace', year: 2020, productionType: 'Theater', billing: 'Lead', director: 'Kenny Leon', producingEntity: 'Second Stage', verification: 'verified', verifiedBy: 'Second Stage Theater' },
    { id: 'c6', title: 'New Amsterdam', role: 'Dr. Reyes', year: 2020, productionType: 'TV', billing: 'Co-Star', producingEntity: 'NBC', verification: 'pending' },
    { id: 'c7', title: 'The Burial at Thebes', role: 'Antigone', year: 2019, productionType: 'Theater', billing: 'Lead', verification: 'self_asserted' },
    { id: 'c8', title: 'Motherless Brooklyn', role: 'Receptionist', year: 2019, productionType: 'Film', billing: 'Day Player', verification: 'self_asserted' },
  ],
};

export const mayaReels: Reel[] = [
  { id: 'r1', artistId: 'artist-maya-okonkwo', title: 'Drama Reel 2024', type: 'reel', duration: 87, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English', accent: 'Standard American' }, visibility: 'public', featured: true, createdAt: '2024-01-15T10:00:00Z', stats: { plays: 8420, likes: 612, saves: 89 }, hasCaptions: true },
  { id: 'r2', artistId: 'artist-maya-okonkwo', title: 'Succession — Guest Appearance', type: 'monologue', duration: 45, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1580130544977-8e41a7e5d9a0?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English', sourceMaterial: 'Succession S4E3' }, visibility: 'public', featured: true, createdAt: '2023-11-10T09:00:00Z', stats: { plays: 3200, likes: 244, saves: 31 }, hasCaptions: false },
  { id: 'r3', artistId: 'artist-maya-okonkwo', title: 'Juilliard Showcase Monologue', type: 'monologue', duration: 62, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1571173802989-8e9b5cca9e03?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English', sourceMaterial: 'August Wilson' }, visibility: 'platform_only', featured: false, createdAt: '2023-05-20T14:00:00Z', stats: { plays: 1100, likes: 98, saves: 14 }, hasCaptions: false },
  { id: 'r4', artistId: 'artist-maya-okonkwo', title: 'Commercial Reel', type: 'reel', duration: 55, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English' }, visibility: 'industry_only', featured: false, createdAt: '2023-03-08T11:00:00Z', stats: { plays: 780, likes: 43, saves: 7 }, hasCaptions: false },
  { id: 'r5', artistId: 'artist-maya-okonkwo', title: 'Physical Theatre — Devised Work', type: 'reel', duration: 38, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English' }, visibility: 'public', featured: false, createdAt: '2022-09-14T16:00:00Z', stats: { plays: 2100, likes: 187, saves: 22 }, hasCaptions: false },
  { id: 'r6', artistId: 'artist-maya-okonkwo', title: 'Dialect Reel (6 Accents)', type: 'monologue', duration: 72, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=640&h=360&fit=crop', metadata: { kind: 'actor', language: 'English', accent: 'Multiple' }, visibility: 'public', featured: false, createdAt: '2022-06-01T12:00:00Z', stats: { plays: 4300, likes: 390, saves: 55 }, hasCaptions: false },
];

export const mayaPosts: Post[] = [
  { id: 'p1', artistId: 'artist-maya-okonkwo', content: 'Just wrapped on a new short film with the Brooklyn Youth Chorus. Cannot wait to share more. Grateful for every room I get to walk into.', visibility: 'public', featured: false, pinned: false, createdAt: '2024-03-01T18:00:00Z', stats: { likes: 312, comments: 28, saves: 0 } },
  { id: 'p2', artistId: 'artist-maya-okonkwo', content: 'Callbacks are tomorrow. Sending good vibes to everyone in the waiting room with me. You prepared. Trust that.', visibility: 'public', featured: false, pinned: false, createdAt: '2024-02-14T09:30:00Z', stats: { likes: 187, comments: 14, saves: 0 } },
];

export const mayaLiveStream: LiveStream = {
  id: 'ls1', artistId: 'artist-maya-okonkwo', title: 'Q&A — Preparing for Pilot Season',
  isLive: true, viewerCount: 342, visibility: 'public',
};

export const mayaAvailability: AvailabilityWindow[] = [
  { id: 'av1', startDate: daysFromNow(0), endDate: daysFromNow(14), state: 'available', willingToTravel: true, travelRadius: 200 },
  { id: 'av2', startDate: daysFromNow(15), endDate: daysFromNow(30), state: 'booked', willingToTravel: false, note: 'Film shoot in Atlanta', bookingReference: 'BK-2024-038' },
  { id: 'av3', startDate: daysFromNow(31), endDate: daysFromNow(50), state: 'tentative', willingToTravel: true },
  { id: 'av4', startDate: daysFromNow(51), endDate: daysFromNow(90), state: 'available', willingToTravel: true },
];

// ─────────────────────────── Theo Reyes — Singer ────────────────────────────

export const theoReyes: Artist = {
  id: 'artist-theo-reyes',
  username: 'theo-reyes',
  stageName: 'Theo Reyes',
  pronouns: 'he/him',
  tagline: 'Mezzo-baritone. Jazz. Musical Theatre.',
  location: 'Los Angeles, CA',
  playableAgeRange: [28, 45],
  primaryDiscipline: 'singer',
  secondaryDisciplines: ['musician'],
  identityVerified: true,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  unionAffiliations: [
    { id: 'u3', union: 'Equity', status: 'active', joinedYear: 2015, verification: 'verified' },
    { id: 'u4', union: 'AGMA', status: 'active', joinedYear: 2017, verification: 'verified' },
    { id: 'u5', union: 'AFM', status: 'active', joinedYear: 2016, verification: 'pending' },
  ],
  representation: { agency: 'Paradigm', agent: 'Michelle Torres', type: 'music' },
  headshots: [
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop', alt: 'Theo Reyes — headshot', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=675&fit=crop', alt: 'Concert stage', width: 1200, height: 675 },
  stats: { followers: 28400, following: 510, reels: 5, verifiedCredits: 5 },
  bio: 'Mezzo-baritone vocalist spanning jazz and musical theatre. Recording artist on Blue Note Records. Latest album "Nightshift" available everywhere. Represented by Paradigm.',
  credits: [
    { id: 'c9', title: 'Sunday in the Park with George', role: 'George', year: 2023, productionType: 'Theater', billing: 'Lead', producingEntity: 'LA Opera', verification: 'verified', verifiedBy: 'LA Opera' },
    { id: 'c10', title: 'Nightshift', role: 'Lead Artist', year: 2023, productionType: 'Album', producingEntity: 'Blue Note Records', verification: 'verified', verifiedBy: 'Blue Note Records' },
    { id: 'c11', title: 'Company', role: 'Bobby', year: 2022, productionType: 'Theater', billing: 'Lead', producingEntity: 'Ahmanson Theatre', verification: 'verified', verifiedBy: 'Center Theatre Group' },
    { id: 'c12', title: 'Jazz at Lincoln Center', role: 'Featured Artist', year: 2022, productionType: 'Concert', producingEntity: 'Jazz at Lincoln Center', verification: 'verified' },
    { id: 'c13', title: 'Sweeney Todd', role: 'Sweeney Todd', year: 2021, productionType: 'Theater', billing: 'Lead', producingEntity: 'Pasadena Playhouse', verification: 'verified', verifiedBy: 'Pasadena Playhouse' },
    { id: 'c14', title: 'Between the Lines', role: 'Composer/Performer', year: 2020, productionType: 'Album', verification: 'self_asserted' },
  ],
};

export const theoReels: Reel[] = [
  { id: 'r7', artistId: 'artist-theo-reyes', title: '"Finishing the Hat" — Sondheim', type: 'song', duration: 180, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop', metadata: { kind: 'singer', songTitle: 'Finishing the Hat', key: 'E major', genre: 'Musical Theatre' }, visibility: 'public', featured: true, createdAt: '2024-01-20T12:00:00Z', stats: { plays: 12300, likes: 1840, saves: 290 }, hasCaptions: false },
  { id: 'r8', artistId: 'artist-theo-reyes', title: '"Round Midnight" — Thelonious Monk', type: 'song', duration: 210, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=640&h=360&fit=crop', metadata: { kind: 'singer', songTitle: "Round Midnight", genre: 'Jazz' }, visibility: 'public', featured: false, createdAt: '2023-10-05T10:00:00Z', stats: { plays: 7800, likes: 932, saves: 115 }, hasCaptions: false },
  { id: 'r9', artistId: 'artist-theo-reyes', title: '"Cry Me a River" — Live at Lincoln Center', type: 'song', duration: 195, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=640&h=360&fit=crop', metadata: { kind: 'singer', songTitle: 'Cry Me a River', genre: 'Jazz' }, visibility: 'public', featured: false, createdAt: '2023-08-14T20:00:00Z', stats: { plays: 5400, likes: 620, saves: 88 }, hasCaptions: false },
  { id: 'r10', artistId: 'artist-theo-reyes', title: 'Original: "Nightshift" Title Track', type: 'song', duration: 240, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&h=360&fit=crop', metadata: { kind: 'singer', songTitle: 'Nightshift', genre: 'Jazz/R&B' }, visibility: 'industry_only', featured: false, createdAt: '2023-06-01T08:00:00Z', stats: { plays: 2100, likes: 340, saves: 61 }, hasCaptions: false },
  { id: 'r11', artistId: 'artist-theo-reyes', title: 'Vocal Range Demo', type: 'reel', duration: 65, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=640&h=360&fit=crop', metadata: { kind: 'singer', songTitle: 'Range Demonstration', genre: 'Mixed' }, visibility: 'platform_only', featured: false, createdAt: '2023-02-10T15:00:00Z', stats: { plays: 890, likes: 76, saves: 18 }, hasCaptions: false },
];

export const theoPosts: Post[] = [
  { id: 'p3', artistId: 'artist-theo-reyes', content: '"Nightshift" is officially streaming everywhere. This album took three years and a lot of late nights. Thank you to everyone who believed in it. Link in bio.', visibility: 'public', featured: false, pinned: true, createdAt: '2024-02-28T08:00:00Z', stats: { likes: 2140, comments: 184, saves: 0 } },
  { id: 'p4', artistId: 'artist-theo-reyes', content: "Master class in musical theatre singing at UCLA this weekend. If you're a student looking to grow — come through. DM for details.", visibility: 'public', featured: false, pinned: false, createdAt: '2024-02-10T11:00:00Z', stats: { likes: 543, comments: 47, saves: 0 } },
  { id: 'p5', artistId: 'artist-theo-reyes', content: 'The Ahmanson run of Company was everything. Grateful for every night we had on that stage.', visibility: 'public', featured: false, pinned: false, createdAt: '2023-12-01T20:00:00Z', stats: { likes: 780, comments: 63, saves: 0 } },
];

export const theoAvailability: AvailabilityWindow[] = [
  { id: 'av5', startDate: daysFromNow(0), endDate: daysFromNow(20), state: 'unavailable', willingToTravel: false, note: 'Album press tour' },
  { id: 'av6', startDate: daysFromNow(21), endDate: daysFromNow(60), state: 'available', willingToTravel: true },
  { id: 'av7', startDate: daysFromNow(61), endDate: daysFromNow(90), state: 'tentative', willingToTravel: true, note: 'Potential Equity tour' },
];

// ─────────────────────────── Aria Lindqvist — Dancer ────────────────────────────

export const ariaLindqvist: Artist = {
  id: 'artist-aria-lindqvist',
  username: 'aria-lindqvist',
  stageName: 'Aria Lindqvist',
  pronouns: 'she/they',
  tagline: 'Contemporary. Ballet. Company Member, Hubbard Street.',
  location: 'Chicago, IL',
  playableAgeRange: [18, 30],
  primaryDiscipline: 'dancer',
  secondaryDisciplines: [],
  identityVerified: true,
  avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
  unionAffiliations: [
    { id: 'u6', union: 'AGMA', status: 'active', joinedYear: 2020, verification: 'verified' },
  ],
  representation: undefined,
  headshots: [
    { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=600&fit=crop', alt: 'Aria Lindqvist — dance portrait', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1200&h=675&fit=crop', alt: 'Contemporary dance performance', width: 1200, height: 675 },
  stats: { followers: 9200, following: 145, reels: 4, verifiedCredits: 3 },
  bio: 'Contemporary and ballet dancer. Company member at Hubbard Street Dance Chicago since 2020. Choreographer of original works presented at Chicago Dancemakers Forum.',
  credits: [
    { id: 'c15', title: 'Archipelago', role: 'Principal Dancer', year: 2024, productionType: 'Dance', billing: 'Lead', producingEntity: 'Hubbard Street Dance Chicago', verification: 'verified', verifiedBy: 'Hubbard Street' },
    { id: 'c16', title: 'Season Program 2023', role: 'Company Dancer', year: 2023, productionType: 'Dance', producingEntity: 'Hubbard Street Dance Chicago', verification: 'verified', verifiedBy: 'Hubbard Street' },
    { id: 'c17', title: 'Emergence (World Premiere)', role: 'Soloist', year: 2022, productionType: 'Dance', billing: 'Featured', producingEntity: 'Chicago Dancemakers Forum', verification: 'verified', verifiedBy: 'Chicago Dancemakers Forum' },
    { id: 'c18', title: 'Nutcracker', role: 'Dewdrop', year: 2021, productionType: 'Ballet', billing: 'Soloist', producingEntity: 'Joffrey Ballet', verification: 'pending' },
  ],
};

export const ariaReels: Reel[] = [
  { id: 'r12', artistId: 'artist-aria-lindqvist', title: 'Archipelago — Solo Excerpt', type: 'dance', duration: 95, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=640&h=360&fit=crop', metadata: { kind: 'dancer', style: 'Contemporary', choreographer: 'Alejandro Cerrudo' }, visibility: 'public', featured: true, createdAt: '2024-02-01T09:00:00Z', stats: { plays: 6700, likes: 810, saves: 134 }, hasCaptions: false },
  { id: 'r13', artistId: 'artist-aria-lindqvist', title: 'Contemporary Technique Reel 2024', type: 'dance', duration: 78, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=640&h=360&fit=crop', metadata: { kind: 'dancer', style: 'Contemporary' }, visibility: 'public', featured: true, createdAt: '2024-01-10T11:00:00Z', stats: { plays: 4200, likes: 490, saves: 71 }, hasCaptions: false },
  { id: 'r14', artistId: 'artist-aria-lindqvist', title: 'Ballet Variations', type: 'dance', duration: 120, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=640&h=360&fit=crop', metadata: { kind: 'dancer', style: 'Classical Ballet' }, visibility: 'public', featured: false, createdAt: '2023-11-20T15:00:00Z', stats: { plays: 3100, likes: 320, saves: 45 }, hasCaptions: false },
  { id: 'r15', artistId: 'artist-aria-lindqvist', title: 'Choreography — Original Work', type: 'dance', duration: 145, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=640&h=360&fit=crop', metadata: { kind: 'dancer', style: 'Contemporary/Improvisation', choreographer: 'Aria Lindqvist' }, visibility: 'industry_only', featured: false, createdAt: '2023-09-05T13:00:00Z', stats: { plays: 890, likes: 77, saves: 19 }, hasCaptions: false },
];

export const ariaPosts: Post[] = [
  { id: 'p6', artistId: 'artist-aria-lindqvist', content: "Opening night of Archipelago was everything. The audience's silence during the second movement meant more than any applause.", visibility: 'public', featured: false, pinned: false, createdAt: '2024-01-28T22:00:00Z', stats: { likes: 423, comments: 31, saves: 0 } },
];

export const ariaAvailability: AvailabilityWindow[] = [
  { id: 'av8', startDate: daysFromNow(0), endDate: daysFromNow(10), state: 'booked', willingToTravel: true, note: 'Hubbard Street Spring Season' },
  { id: 'av9', startDate: daysFromNow(11), endDate: daysFromNow(25), state: 'available', willingToTravel: true, travelRadius: 500 },
  { id: 'av10', startDate: daysFromNow(26), endDate: daysFromNow(40), state: 'tentative', willingToTravel: false },
  { id: 'av11', startDate: daysFromNow(41), endDate: daysFromNow(90), state: 'available', willingToTravel: true },
];

// ─────────────────────────── Devon Park — Musician ────────────────────────────

export const devonPark: Artist = {
  id: 'artist-devon-park',
  username: 'devon-park',
  stageName: 'Devon Park',
  pronouns: 'he/him',
  tagline: 'Session musician. Guitar, keys, bass. Nashville.',
  location: 'Nashville, TN',
  playableAgeRange: [25, 40],
  primaryDiscipline: 'musician',
  secondaryDisciplines: [],
  identityVerified: false,
  avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
  unionAffiliations: [
    { id: 'u7', union: 'AFM', status: 'active', joinedYear: 2019, verification: 'self_asserted' },
  ],
  representation: undefined,
  headshots: [
    { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop', alt: 'Devon Park — portrait', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=675&fit=crop', alt: 'Recording studio', width: 1200, height: 675 },
  stats: { followers: 6700, following: 88, reels: 3, verifiedCredits: 3 },
  bio: 'Multi-instrumentalist based in Nashville. Session guitarist, keys, and bass player with 15+ studio credits across country, Americana, and film scoring.',
  credits: [
    { id: 'c19', title: 'Lacy Grove — "Wildfire"', role: 'Session Guitarist', year: 2024, productionType: 'Album', producingEntity: 'Republic Records', verification: 'verified', verifiedBy: 'Republic Records' },
    { id: 'c20', title: 'Feature Film Score — "Hollow Ground"', role: 'Guitar/Keys', year: 2023, productionType: 'Film', producingEntity: 'A24', verification: 'verified', verifiedBy: 'A24' },
    { id: 'c21', title: 'Marcus Hayes — "From Here"', role: 'Session Bassist', year: 2023, productionType: 'Album', producingEntity: 'Sony Nashville', verification: 'verified', verifiedBy: 'Sony Nashville' },
    { id: 'c22', title: 'Maren Morris Touring Band', role: 'Touring Guitarist', year: 2022, productionType: 'Live/Tour', producingEntity: 'WME', verification: 'pending' },
    { id: 'c23', title: 'Devon Park — "Undercurrent"', role: 'Composer/Performer', year: 2022, productionType: 'EP', verification: 'self_asserted' },
  ],
};

export const devonReels: Reel[] = [
  { id: 'r16', artistId: 'artist-devon-park', title: 'Session Guitar — Studio Reel 2024', type: 'reel', duration: 90, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=640&h=360&fit=crop', metadata: { kind: 'musician', instrument: 'Guitar', genre: 'Country/Americana' }, visibility: 'public', featured: true, createdAt: '2024-01-25T14:00:00Z', stats: { plays: 3200, likes: 287, saves: 43 }, hasCaptions: false },
  { id: 'r17', artistId: 'artist-devon-park', title: '"Undercurrent" — Original Composition', type: 'reel', duration: 210, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=640&h=360&fit=crop', metadata: { kind: 'musician', instrument: 'Guitar/Keys/Bass', genre: 'Americana' }, visibility: 'public', featured: false, createdAt: '2023-07-12T16:00:00Z', stats: { plays: 1800, likes: 154, saves: 28 }, hasCaptions: false },
  { id: 'r18', artistId: 'artist-devon-park', title: 'Film Score Demo — "Hollow Ground"', type: 'reel', duration: 75, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=360&fit=crop', metadata: { kind: 'musician', instrument: 'Guitar/Keys', genre: 'Film Score' }, visibility: 'industry_only', featured: false, createdAt: '2023-04-08T10:00:00Z', stats: { plays: 620, likes: 55, saves: 12 }, hasCaptions: false },
];

export const devonPosts: Post[] = [
  { id: 'p7', artistId: 'artist-devon-park', content: "Just wrapped a week of tracking for a record I cannot name yet. Cannot wait for you all to hear this one.", visibility: 'public', featured: false, pinned: false, createdAt: '2024-02-20T19:00:00Z', stats: { likes: 210, comments: 18, saves: 0 } },
];

export const devonAvailability: AvailabilityWindow[] = [
  { id: 'av12', startDate: daysFromNow(0), endDate: daysFromNow(7), state: 'available', willingToTravel: true, travelRadius: 300 },
  { id: 'av13', startDate: daysFromNow(8), endDate: daysFromNow(21), state: 'tentative', willingToTravel: true },
  { id: 'av14', startDate: daysFromNow(22), endDate: daysFromNow(90), state: 'available', willingToTravel: true },
];

// ─────────────────────────── Jamie Wexler — Voice Actor ────────────────────────────

export const jamieWexler: Artist = {
  id: 'artist-jamie-wexler',
  username: 'jamie-wexler',
  stageName: 'Jamie Wexler',
  pronouns: 'they/them',
  tagline: 'Animation. Video Games. Commercial. Home studio.',
  location: 'Remote (Los Angeles, CA)',
  playableAgeRange: [20, 55],
  primaryDiscipline: 'voice_actor',
  secondaryDisciplines: [],
  identityVerified: true,
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  unionAffiliations: [
    { id: 'u8', union: 'SAG-AFTRA', status: 'active', joinedYear: 2016, verification: 'verified' },
  ],
  representation: { agency: 'CESD Talent Agency', agent: 'Rachel Kim', type: 'voice' },
  headshots: [
    { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop', alt: 'Jamie Wexler — portrait', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=675&fit=crop', alt: 'Recording microphone', width: 1200, height: 675 },
  stats: { followers: 11200, following: 340, reels: 8, verifiedCredits: 4 },
  bio: 'Professional voice actor with broadcast-quality home studio. Specialising in animation, video games, commercial, and audiobooks. SAG-AFTRA. 25+ credits. Represented by CESD.',
  credits: [
    { id: 'c24', title: 'Apex Legends', role: 'Valkyrie (additional dialogue)', year: 2023, productionType: 'Video Game', producingEntity: 'Respawn/EA', verification: 'verified', verifiedBy: 'Respawn Entertainment' },
    { id: 'c25', title: 'Disenchantment', role: 'Guard #3 / Villager', year: 2023, productionType: 'Animation', producingEntity: 'Netflix Animation', verification: 'verified', verifiedBy: 'Netflix' },
    { id: 'c26', title: '"The Architecture of Loss" Audiobook', role: 'Narrator', year: 2022, productionType: 'Audiobook', producingEntity: 'Penguin Audio', verification: 'verified', verifiedBy: 'Penguin Random House' },
    { id: 'c27', title: 'Ford — "Built for Tomorrow" Campaign', role: 'Voiceover', year: 2022, productionType: 'Commercial', producingEntity: 'JWT New York', verification: 'verified', verifiedBy: 'JWT' },
    { id: 'c28', title: 'Hades II (Early Access)', role: 'Spirit Merchant', year: 2024, productionType: 'Video Game', producingEntity: 'Supergiant Games', verification: 'pending' },
  ],
};

export const jamieReels: Reel[] = [
  { id: 'r19', artistId: 'artist-jamie-wexler', title: 'Commercial Demo', type: 'voice_demo', duration: 60, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Commercial' }, visibility: 'public', featured: true, createdAt: '2024-01-05T10:00:00Z', stats: { plays: 5400, likes: 430, saves: 67 }, hasCaptions: false },
  { id: 'r20', artistId: 'artist-jamie-wexler', title: 'Animation Demo', type: 'voice_demo', duration: 75, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Animation' }, visibility: 'public', featured: true, createdAt: '2024-01-05T10:05:00Z', stats: { plays: 7200, likes: 680, saves: 112 }, hasCaptions: false },
  { id: 'r21', artistId: 'artist-jamie-wexler', title: 'Video Game Demo', type: 'voice_demo', duration: 80, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Video Game' }, visibility: 'public', featured: false, createdAt: '2024-01-05T10:10:00Z', stats: { plays: 4100, likes: 320, saves: 58 }, hasCaptions: false },
  { id: 'r22', artistId: 'artist-jamie-wexler', title: 'Narration Demo', type: 'voice_demo', duration: 65, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Narration' }, visibility: 'public', featured: false, createdAt: '2024-01-05T10:15:00Z', stats: { plays: 3300, likes: 270, saves: 41 }, hasCaptions: false },
  { id: 'r23', artistId: 'artist-jamie-wexler', title: 'Audiobook Sample — "The Architecture of Loss"', type: 'voice_demo', duration: 120, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Audiobook' }, visibility: 'industry_only', featured: false, createdAt: '2023-11-15T09:00:00Z', stats: { plays: 1200, likes: 98, saves: 22 }, hasCaptions: false },
  { id: 'r24', artistId: 'artist-jamie-wexler', title: 'Character Voices Demo', type: 'voice_demo', duration: 90, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Animation' }, visibility: 'public', featured: false, createdAt: '2023-09-20T14:00:00Z', stats: { plays: 2800, likes: 230, saves: 34 }, hasCaptions: false },
  { id: 'r25', artistId: 'artist-jamie-wexler', title: 'Corporate/E-Learning Demo', type: 'voice_demo', duration: 55, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Narration' }, visibility: 'platform_only', featured: false, createdAt: '2023-07-11T11:00:00Z', stats: { plays: 780, likes: 52, saves: 9 }, hasCaptions: false },
  { id: 'r26', artistId: 'artist-jamie-wexler', title: 'Promo/Trailer Demo', type: 'voice_demo', duration: 45, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=640&h=360&fit=crop', metadata: { kind: 'voice_actor', category: 'Commercial' }, visibility: 'public', featured: false, createdAt: '2023-05-04T16:00:00Z', stats: { plays: 3900, likes: 310, saves: 47 }, hasCaptions: false },
];

export const jamiePosts: Post[] = [
  { id: 'p8', artistId: 'artist-jamie-wexler', content: "Just hit the booth on a project I've been waiting to announce. More soon. Hint: it involves swords.", visibility: 'public', featured: false, pinned: false, createdAt: '2024-03-02T15:00:00Z', stats: { likes: 445, comments: 38, saves: 0 } },
  { id: 'p9', artistId: 'artist-jamie-wexler', content: 'Home studio tip: invest in your acoustic treatment before your microphone. A great mic in a bad room sounds worse than a decent mic in a treated one.', visibility: 'platform_only', featured: false, pinned: false, createdAt: '2024-01-18T12:00:00Z', stats: { likes: 620, comments: 55, saves: 0 } },
];

export const jamieAvailability: AvailabilityWindow[] = [
  { id: 'av15', startDate: daysFromNow(0), endDate: daysFromNow(90), state: 'available', willingToTravel: false, note: 'Remote only — home studio sessions available immediately' },
];

// ─────────────────────────── Sam Quintero — Comedian ────────────────────────────

export const samQuintero: Artist = {
  id: 'artist-sam-quintero',
  username: 'sam-quintero',
  stageName: 'Sam Quintero',
  pronouns: 'he/him',
  tagline: 'Standup. Sketch. UCB. Comedy Cellar.',
  location: 'Brooklyn, NY',
  playableAgeRange: [25, 45],
  primaryDiscipline: 'comedian',
  secondaryDisciplines: [],
  identityVerified: false,
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
  unionAffiliations: [],
  representation: undefined,
  headshots: [
    { url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&h=600&fit=crop', alt: 'Sam Quintero — portrait', width: 600, height: 600 },
  ],
  coverImage: { url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&h=675&fit=crop', alt: 'Comedy club stage', width: 1200, height: 675 },
  stats: { followers: 4800, following: 67, reels: 4, verifiedCredits: 4 },
  bio: 'Standup and sketch comedian. Regular at the Comedy Cellar and Upright Citizens Brigade. Tribeca Comedy Festival 2024. NYCF Emerging Comic 2021.',
  credits: [
    { id: 'c29', title: 'Tribeca Comedy Festival', role: 'Featured Performer', year: 2024, productionType: 'Festival', producingEntity: 'Tribeca Film Festival', verification: 'verified', verifiedBy: 'Tribeca' },
    { id: 'c30', title: 'Clusterfest', role: 'Main Stage', year: 2023, productionType: 'Festival', producingEntity: 'Comedy Central', verification: 'verified', verifiedBy: 'Comedy Central' },
    { id: 'c31', title: '"Quarter-Life Crisis" — Comedy Special', role: 'Creator/Performer', year: 2023, productionType: 'Special', producingEntity: 'Self-produced', verification: 'self_asserted' },
    { id: 'c32', title: 'UCB Cagematch Champion', role: 'Ensemble', year: 2022, productionType: 'Competition', producingEntity: 'Upright Citizens Brigade', verification: 'verified', verifiedBy: 'UCB' },
    { id: 'c33', title: 'New York Comedy Festival', role: 'Emerging Comic Showcase', year: 2021, productionType: 'Festival', producingEntity: 'NYCF', verification: 'verified' },
    { id: 'c34', title: 'Just for Laughs — New Faces', role: 'New Face', year: 2022, productionType: 'Festival', producingEntity: 'Just for Laughs', verification: 'pending' },
  ],
};

export const samReels: Reel[] = [
  { id: 'r27', artistId: 'artist-sam-quintero', title: 'Late Night Standup Set — 8 min', type: 'comedy', duration: 480, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=640&h=360&fit=crop', metadata: { kind: 'comedian', format: 'standup' }, visibility: 'public', featured: true, createdAt: '2024-02-15T22:00:00Z', stats: { plays: 8900, likes: 1240, saves: 190 }, hasCaptions: false },
  { id: 'r28', artistId: 'artist-sam-quintero', title: 'UCB Sketch — "The Interview"', type: 'comedy', duration: 180, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=640&h=360&fit=crop', metadata: { kind: 'comedian', format: 'sketch' }, visibility: 'public', featured: true, createdAt: '2024-01-08T19:00:00Z', stats: { plays: 3400, likes: 430, saves: 64 }, hasCaptions: false },
  { id: 'r29', artistId: 'artist-sam-quintero', title: 'Tribeca Set Excerpt — 5 min', type: 'comedy', duration: 300, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=640&h=360&fit=crop', metadata: { kind: 'comedian', format: 'standup' }, visibility: 'public', featured: false, createdAt: '2023-10-12T21:00:00Z', stats: { plays: 2100, likes: 280, saves: 37 }, hasCaptions: false },
  { id: 'r30', artistId: 'artist-sam-quintero', title: 'Improv Cagematch — Best Moments', type: 'comedy', duration: 210, videoUrl: VIDEO, thumbnailUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=640&h=360&fit=crop', metadata: { kind: 'comedian', format: 'improv' }, visibility: 'platform_only', featured: false, createdAt: '2023-07-20T20:00:00Z', stats: { plays: 1200, likes: 140, saves: 21 }, hasCaptions: false },
];

export const samPosts: Post[] = [
  { id: 'p10', artistId: 'artist-sam-quintero', content: "New set at the Cellar on Thursday. Come out. I'm trying new material and it might bomb spectacularly — which is half the fun.", visibility: 'public', featured: false, pinned: false, createdAt: '2024-03-03T11:00:00Z', stats: { likes: 187, comments: 24, saves: 0 } },
  { id: 'p11', artistId: 'artist-sam-quintero', content: 'Got into the Tribeca Comedy Festival. First time. Still processing.', visibility: 'public', featured: false, pinned: false, createdAt: '2024-01-05T16:00:00Z', stats: { likes: 923, comments: 78, saves: 0 } },
];

export const samAvailability: AvailabilityWindow[] = [
  { id: 'av16', startDate: daysFromNow(0), endDate: daysFromNow(30), state: 'available', willingToTravel: true, travelRadius: 150, note: 'Available for bookings — contact for rates' },
  { id: 'av17', startDate: daysFromNow(31), endDate: daysFromNow(60), state: 'tentative', willingToTravel: true },
  { id: 'av18', startDate: daysFromNow(61), endDate: daysFromNow(90), state: 'available', willingToTravel: true },
];

// ─────────────────────────── Registry ────────────────────────────

export const ARTIST_REGISTRY: Record<string, {
  artist: Artist;
  reels: Reel[];
  posts: Post[];
  liveStream?: LiveStream;
  availability: AvailabilityWindow[];
}> = {
  'maya-okonkwo': { artist: mayaOkonkwo, reels: mayaReels, posts: mayaPosts, liveStream: mayaLiveStream, availability: mayaAvailability },
  'theo-reyes': { artist: theoReyes, reels: theoReels, posts: theoPosts, availability: theoAvailability },
  'aria-lindqvist': { artist: ariaLindqvist, reels: ariaReels, posts: ariaPosts, availability: ariaAvailability },
  'devon-park': { artist: devonPark, reels: devonReels, posts: devonPosts, availability: devonAvailability },
  'jamie-wexler': { artist: jamieWexler, reels: jamieReels, posts: jamiePosts, availability: jamieAvailability },
  'sam-quintero': { artist: samQuintero, reels: samReels, posts: samPosts, availability: samAvailability },
};

export function getArtistData(username: string) {
  return ARTIST_REGISTRY[username] ?? null;
}
