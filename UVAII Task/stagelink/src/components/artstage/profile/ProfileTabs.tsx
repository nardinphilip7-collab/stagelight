'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Artist, Reel, Post, LiveStream, AvailabilityWindow } from '@/lib/artstage/types';
import { FeaturedTab } from '../tabs/FeaturedTab';
import { ReelsTab } from '../tabs/ReelsTab';
import { PortfolioTab } from '../tabs/PortfolioTab';
import { PostsTab } from '../tabs/PostsTab';
import { AvailabilityTab } from '../tabs/AvailabilityTab';

export type TabId = 'featured' | 'reels' | 'portfolio' | 'posts' | 'availability';

const TABS: { id: TabId; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'reels', label: 'Reels' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'posts', label: 'Posts' },
  { id: 'availability', label: 'Availability' },
];

interface ProfileTabsProps {
  artist: Artist;
  reels: Reel[];
  posts: Post[];
  liveStream?: LiveStream;
  availability: AvailabilityWindow[];
}

export function ProfileTabs({ artist, reels, posts, liveStream, availability }: ProfileTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = (searchParams.get('tab') as TabId) ?? 'featured';

  const setTab = (id: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* Tab bar */}
      <nav
        className="as-sticky-tabs"
        aria-label="Profile sections"
      >
        <div className="flex overflow-x-auto px-4 md:px-8" style={{ gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`shrink-0 px-4 py-3 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
                activeTab === tab.id
                  ? 'as-tab-active'
                  : 'hover:opacity-80'
              }`}
              style={activeTab !== tab.id ? { color: 'var(--as-text-secondary)', borderBottom: '2px solid transparent' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find(t => t.id === activeTab)?.label}
        className="min-h-[400px]"
      >
        {activeTab === 'featured' && (
          <FeaturedTab artist={artist} reels={reels} posts={posts} liveStream={liveStream} />
        )}
        {activeTab === 'reels' && (
          <ReelsTab artist={artist} reels={reels} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioTab artist={artist} />
        )}
        {activeTab === 'posts' && (
          <PostsTab artist={artist} posts={posts} />
        )}
        {activeTab === 'availability' && (
          <AvailabilityTab artist={artist} availability={availability} />
        )}
      </main>
    </div>
  );
}
