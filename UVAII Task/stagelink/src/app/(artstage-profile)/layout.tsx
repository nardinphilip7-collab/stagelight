import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artist Profile — ArtStage',
};

export default function ArtStageProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="artstage">
      {children}
    </div>
  );
}
