'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

interface FollowRecord { id: number; }

export function FollowButton({ talentId, initialFollowing = false }: { talentId: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followId, setFollowId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!talentId) return;
    apiClient.get<FollowRecord[]>(`/follows/?talent=${talentId}`)
      .then(records => {
        if (records.length > 0) {
          setFollowing(true);
          setFollowId(records[0].id);
        } else {
          setFollowing(false);
          setFollowId(null);
        }
      })
      .catch(() => {});
  }, [talentId]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (following && followId != null) {
        await apiClient.delete(`/follows/${followId}/`);
        setFollowing(false);
        setFollowId(null);
      } else {
        const record = await apiClient.post<FollowRecord>('/follows/', { talent: talentId });
        setFollowing(true);
        setFollowId(record.id);
      }
    } catch {
      // revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={following ? 'as-btn-outline' : 'as-btn-primary'}
      aria-pressed={following}
      aria-label={following ? 'Unfollow artist' : 'Follow artist'}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
}

export function MessageButton({ ownerUserId }: { ownerUserId?: number }) {
  const router = useRouter();
  return (
    <button
      className="as-btn-outline"
      aria-label="Send message"
      onClick={() => {
        if (ownerUserId) {
          router.push(`/messages?with=${ownerUserId}`);
        } else {
          router.push('/messages');
        }
      }}
    >
      Message
    </button>
  );
}
