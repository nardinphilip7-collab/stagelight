import type { Post, Artist } from '@/lib/artstage/types';
import { PostCard } from './PostCard';

interface FeaturedPostBannerProps {
  post: Post;
  artist: Artist;
}

export function FeaturedPostBanner({ post, artist }: FeaturedPostBannerProps) {
  return (
    <section aria-labelledby="pinned-post-heading">
      <h2 id="pinned-post-heading" className="text-[15px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>
        Pinned post
      </h2>
      <PostCard post={post} artist={artist} />
    </section>
  );
}
