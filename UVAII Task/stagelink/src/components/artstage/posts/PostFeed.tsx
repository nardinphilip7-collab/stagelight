import type { Post, Artist } from '@/lib/artstage/types';
import { PostCard } from './PostCard';
import { EmptyState } from '../shared/EmptyState';

interface PostFeedProps {
  posts: Post[];
  artist: Artist;
}

export function PostFeed({ posts, artist }: PostFeedProps) {
  const sorted = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (sorted.length === 0) {
    return <EmptyState title="No posts yet" message="Posts from this artist will appear here." />;
  }

  return (
    <div className="space-y-4">
      {sorted.map(p => <PostCard key={p.id} post={p} artist={artist} />)}
    </div>
  );
}
