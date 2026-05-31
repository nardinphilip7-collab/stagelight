import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create — ArtStage',
};

export default function ArtStageCreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="artstage">
      {children}
    </div>
  );
}
