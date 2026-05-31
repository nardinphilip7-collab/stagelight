'use client';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export function InviteToRoleButton({ artistName, ownerUserId }: { artistName: string; ownerUserId: string }) {
  const router = useRouter();
  const currentUser = getUser();

  const handleClick = () => {
    const role = currentUser?.role;
    if (role === 'HIRER' || role === 'AGENCY') {
      router.push('/bookings');
    } else if (ownerUserId) {
      router.push(`/messages/${ownerUserId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="as-btn-primary"
      aria-label={`Invite ${artistName} to a role`}
    >
      Invite to role
    </button>
  );
}
