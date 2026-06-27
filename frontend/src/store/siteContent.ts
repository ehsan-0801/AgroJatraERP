import { create } from 'zustand';

export interface ShowcaseItem { url: string; name?: string }

interface SiteContentState {
  showcase: ShowcaseItem[];
  setShowcase: (items: ShowcaseItem[]) => void;
}

/** Holds super-admin-managed homepage content (e.g. the product showcase),
 *  populated once from the public /content endpoint on app load. */
export const useSiteContent = create<SiteContentState>((set) => ({
  showcase: [],
  setShowcase: (showcase) => set({ showcase }),
}));
