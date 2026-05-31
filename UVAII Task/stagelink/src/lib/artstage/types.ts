export type Discipline =
  | 'actor' | 'singer' | 'dancer' | 'musician'
  | 'voice_actor' | 'comedian' | 'presenter' | 'director';

export type VerificationState = 'self_asserted' | 'pending' | 'verified';

export type ContentVisibility =
  | 'public'
  | 'platform_only'
  | 'industry_only'
  | 'scout_only'
  | 'private';

export interface Image {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Representation {
  agency: string;
  agent: string;
  type: 'theatrical' | 'commercial' | 'voice' | 'music' | 'multi';
}

export interface Artist {
  id: string;
  username: string;
  ownerUserId?: number;
  stageName: string;
  pronouns?: string;
  tagline: string;
  location: string;
  playableAgeRange: [number, number];
  primaryDiscipline: Discipline;
  secondaryDisciplines: Discipline[];
  identityVerified: boolean;
  unionAffiliations: UnionAffiliation[];
  representation?: Representation;
  headshots: Image[];
  coverImage?: Image;
  stats: {
    followers: number;
    following: number;
    reels: number;
    verifiedCredits: number;
  };
  bio: string;
  credits: Credit[];
  avatar: string;
}

export interface Credit {
  id: string;
  title: string;
  role: string;
  year: number;
  productionType: string;
  billing?: string;
  director?: string;
  producingEntity?: string;
  verification: VerificationState;
  verifiedBy?: string;
}

export interface Training {
  id: string;
  institution: string;
  program: string;
  startYear: number;
  endYear?: number;
  degree?: string;
  verification: VerificationState;
}

export interface UnionAffiliation {
  id: string;
  union: string;
  status: 'active' | 'inactive' | 'financial_core' | 'eligible';
  joinedYear: number;
  verification: VerificationState;
}

export type ReelMetadata =
  | { kind: 'actor'; accent?: string; language: string; sourceMaterial?: string }
  | { kind: 'singer'; songTitle: string; key?: string; tempo?: number; genre: string }
  | { kind: 'dancer'; style: string; choreographer?: string }
  | { kind: 'musician'; instrument: string; genre: string }
  | { kind: 'voice_actor'; category: string }
  | { kind: 'comedian'; format: 'standup' | 'sketch' | 'improv' };

export interface Reel {
  id: string;
  artistId: string;
  title: string;
  type: 'monologue' | 'song' | 'dance' | 'voice_demo' | 'comedy' | 'reel' | 'cover';
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  description?: string;
  metadata: ReelMetadata;
  visibility: ContentVisibility;
  scoutExpiresAt?: string;
  featured: boolean;
  createdAt: string;
  stats: { plays: number; likes: number; saves: number };
  hasCaptions: boolean;
}

export interface Post {
  id: string;
  artistId: string;
  content: string;
  attachments?: Image[];
  visibility: ContentVisibility;
  featured: boolean;
  pinned: boolean;
  createdAt: string;
  stats: { likes: number; comments: number; saves: number };
}

export interface LiveStream {
  id: string;
  artistId: string;
  title: string;
  isLive: boolean;
  scheduledFor?: string;
  startedAt?: string;
  viewerCount?: number;
  coHosts?: string[];
  visibility: ContentVisibility;
}

export interface Duet {
  id: string;
  artistId: string;
  originalReelId: string;
  originalArtistId: string;
  videoUrl: string;
  thumbnailUrl: string;
  visibility: ContentVisibility;
  createdAt: string;
  layout: 'side_by_side' | 'picture_in_picture' | 'reaction';
}

export type AvailabilityState = 'available' | 'tentative' | 'unavailable' | 'booked';

export interface AvailabilityWindow {
  id: string;
  startDate: string;
  endDate: string;
  state: AvailabilityState;
  willingToTravel: boolean;
  travelRadius?: number;
  note?: string;
  bookingReference?: string;
}
