import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicScholarship } from '../data/public';

export interface ApplicationTrackerItem {
  id: string; // Scholarship ID
  scholarship: PublicScholarship;
  status: 'Interested' | 'Preparing' | 'Documents Needed' | 'Application Started' | 'Submitted' | 'Interview' | 'Accepted' | 'Rejected' | 'Waitlisted' | 'Withdrawn';
  notes: string;
  reminderDate?: string;
  addedAt: string;
}

interface UserProfile {
  name: string;
  email: string;
  degreeLevel: string;
  field: string;
  targetCountries: string[];
  gpa: number | null;
  needFullFunding: boolean;
  citizenship: string;
}

interface AppState {
  // User Session
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Saved / Tracked Data
  savedScholarshipIds: string[];
  toggleSaveScholarship: (id: string) => void;
  isSaved: (id: string) => boolean;

  compareIds: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  applications: ApplicationTrackerItem[];
  trackApplication: (scholarship: PublicScholarship, status?: ApplicationTrackerItem['status']) => void;
  updateApplicationStatus: (id: string, status: ApplicationTrackerItem['status']) => void;
  removeApplication: (id: string) => void;

  // Search State
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

/** Baseline profile shape, so partial restores always produce a complete object. */
const EMPTY_PROFILE: UserProfile = {
  name: '',
  email: '',
  degreeLevel: '',
  field: '',
  targetCountries: [],
  gpa: null,
  needFullFunding: false,
  citizenship: ''
};

/** The subset of state written to localStorage. */
interface PersistedState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  savedScholarshipIds: string[];
  applications: ApplicationTrackerItem[];
  recentSearches: string[];
  compareIds: string[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      login: (email, name) => set({
        isAuthenticated: true,
        user: { ...EMPTY_PROFILE, email, name }
      }),

      logout: () => set({ isAuthenticated: false, user: null }),

      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      savedScholarshipIds: [],
      toggleSaveScholarship: (id) => set((state) => {
        const exists = state.savedScholarshipIds.includes(id);
        if (exists) {
          return { savedScholarshipIds: state.savedScholarshipIds.filter(sId => sId !== id) };
        }
        return { savedScholarshipIds: [...state.savedScholarshipIds, id] };
      }),
      isSaved: (id) => get().savedScholarshipIds.includes(id),

      compareIds: [],
      toggleCompare: (id) => set((state) => {
        const exists = state.compareIds.includes(id);
        if (exists) {
          return { compareIds: state.compareIds.filter(cId => cId !== id) };
        }
        if (state.compareIds.length >= 4) {
          return state; // Max 4 items to compare
        }
        return { compareIds: [...state.compareIds, id] };
      }),
      clearCompare: () => set({ compareIds: [] }),

      applications: [],
      trackApplication: (scholarship, status = 'Interested') => set((state) => {
        const exists = state.applications.some(app => app.id === scholarship.id);
        if (exists) return state;

        return {
          applications: [...state.applications, {
            id: scholarship.id,
            scholarship,
            status,
            notes: '',
            addedAt: new Date().toISOString()
          }]
        };
      }),
      updateApplicationStatus: (id, status) => set((state) => ({
        applications: state.applications.map(app =>
          app.id === id ? { ...app, status } : app
        )
      })),
      removeApplication: (id) => set((state) => ({
        applications: state.applications.filter(app => app.id !== id)
      })),

      recentSearches: [],
      addRecentSearch: (query) => set((state) => {
        if (!query.trim()) return state;
        const filtered = state.recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
        return {
          recentSearches: [query, ...filtered].slice(0, 5)
        };
      }),
      clearRecentSearches: () => set({ recentSearches: [] })
    }),
    {
      name: 'scholaratlas-storage', // key in local storage
      partialize: (state) => ({
        // Session and profile must persist, otherwise login state and any profile
        // edits are silently discarded on reload.
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        savedScholarshipIds: state.savedScholarshipIds,
        applications: state.applications,
        recentSearches: state.recentSearches,
        compareIds: state.compareIds
      }),
      // Guard against a corrupt or stale payload breaking app start-up.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          isAuthenticated: Boolean(saved.isAuthenticated && saved.user),
          user: saved.user
            ? { ...EMPTY_PROFILE, ...saved.user }
            : null,
          savedScholarshipIds: Array.isArray(saved.savedScholarshipIds)
            ? saved.savedScholarshipIds
            : [],
          applications: Array.isArray(saved.applications) ? saved.applications : [],
          recentSearches: Array.isArray(saved.recentSearches) ? saved.recentSearches : [],
          compareIds: Array.isArray(saved.compareIds) ? saved.compareIds : [],
        };
      },
      version: 2,
      // v1 payloads lacked session/profile fields. Carry forward everything that
      // was already saved rather than discarding a user's saved list.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<PersistedState>;
        return {
          isAuthenticated: false,
          user: null,
          savedScholarshipIds: old.savedScholarshipIds ?? [],
          applications: old.applications ?? [],
          recentSearches: old.recentSearches ?? [],
          compareIds: old.compareIds ?? [],
        };
      },
    }
  )
);
