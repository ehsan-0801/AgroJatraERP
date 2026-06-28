import { create } from 'zustand';

export interface ShowcaseItem { url: string; name?: string }
export interface Review { rating: number; comment: string; organization_name: string; organization_address?: string | null; author_name?: string | null }

interface SiteContentState {
  showcase: ShowcaseItem[];
  reviews: Review[];
  setShowcase: (items: ShowcaseItem[]) => void;
  setReviews: (items: Review[]) => void;
}

/** Holds super-admin-managed homepage content (product showcase) and the
 *  organization reviews, populated once from public endpoints on app load. */
export const useSiteContent = create<SiteContentState>((set) => ({
  showcase: [],
  reviews: [],
  setShowcase: (showcase) => set({ showcase }),
  setReviews: (reviews) => set({ reviews }),
}));
