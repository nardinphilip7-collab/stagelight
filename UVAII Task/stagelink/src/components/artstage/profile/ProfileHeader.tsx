import Image from 'next/image';
import type { Artist } from '@/lib/artstage/types';
import { VerifiedBadge } from './VerifiedBadge';
import { DisciplineBadge } from './DisciplineBadge';
import { FollowButton, MessageButton } from './FollowButton';
import { InviteToRoleButton } from './InviteToRoleButton';
import { MapPin, Briefcase } from 'lucide-react';

interface ProfileHeaderProps {
  artist: Artist;
  talentId: string;
  isOwner?: boolean;
  isHirer?: boolean;
}

export function ProfileHeader({ artist, talentId, isOwner = false, isHirer = false }: ProfileHeaderProps) {
  const headshot = artist.headshots[0];

  return (
    <header>
      {/* Cover image */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '16/5', backgroundColor: '#EFE9DE' }}
      >
        {artist.coverImage && (
          <Image
            src={artist.coverImage.url}
            alt={artist.coverImage.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
      </div>

      {/* Identity row */}
      <div
        className="relative px-4 md:px-8"
        style={{ backgroundColor: 'var(--as-surface)', borderBottom: '1px solid var(--as-border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 pb-5">
          {/* Headshot — overlaps cover */}
          <div
            className="shrink-0 self-start -mt-10 md:-mt-14"
            style={{
              width: 112, height: 112,
              borderRadius: 8,
              border: '3px solid var(--as-surface)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 1px 4px rgba(26,26,26,0.12)',
            }}
          >
            {headshot ? (
              <Image
                src={headshot.url}
                alt={headshot.alt}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-semibold"
                style={{ backgroundColor: '#EFE9DE', color: 'var(--as-text-secondary)' }}
                aria-label={`${artist.stageName} avatar`}
              >
                {artist.stageName[0]}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-2 md:pt-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1
                className="as-display text-[26px] md:text-[30px] font-medium leading-tight"
                style={{ color: 'var(--as-text)' }}
              >
                {artist.stageName}
              </h1>
              {artist.pronouns && (
                <span className="text-[13px]" style={{ color: 'var(--as-text-muted)' }}>
                  {artist.pronouns}
                </span>
              )}
              {artist.identityVerified && (
                <VerifiedBadge size="md" label="Identity verified" />
              )}
            </div>

            <p className="mt-1 text-[14px]" style={{ color: 'var(--as-text-secondary)' }}>
              {artist.tagline}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--as-text-muted)' }}>
                <MapPin size={13} aria-hidden="true" />
                {artist.location}
              </span>
              {artist.representation && (
                <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--as-text-muted)' }}>
                  <Briefcase size={13} aria-hidden="true" />
                  {artist.representation.agency}
                </span>
              )}
              <span className="text-[13px]" style={{ color: 'var(--as-text-muted)' }}>
                Ages {artist.playableAgeRange[0]}–{artist.playableAgeRange[1]}
              </span>
            </div>

            <div className="mt-3">
              <DisciplineBadge
                discipline={artist.primaryDiscipline}
                secondary={artist.secondaryDisciplines}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center pb-1">
            {isOwner ? (
              <button className="as-btn-outline" aria-label="Edit profile">Edit profile</button>
            ) : (
              <>
                <FollowButton talentId={talentId} />
                <MessageButton />
                {isHirer && (
                  <InviteToRoleButton
                    artistName={artist.stageName}
                    ownerUserId={artist.ownerUserId?.toString() ?? ""}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
