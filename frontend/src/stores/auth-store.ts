import { create } from 'zustand';

interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6eyJpZCI6MiwibmFtZSI6IlVzZXIiLCJfX2VudGl0eSI6IlJvbGVFbnRpdHkifSwic2Vzc2lvbklkIjoyLCJ0ZWxlZ3JhbUlkIjoxMjM0NTY3ODksImJ1c2luZXNzSWQiOiJhZDVkYTY3Ny00NDY0LTQ3NDctYTA1OC01YzI5YWMxMmVjNjIiLCJpYXQiOjE3NzY0Mjc0MTUsImV4cCI6MTc3NjQyODMxNX0.-DKBmBohXDVrEU_FNJwJThWhkkVvkpkl-pttiIeZ3z4',

  setToken: (token) =>
    set({
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6eyJpZCI6MiwibmFtZSI6IlVzZXIiLCJfX2VudGl0eSI6IlJvbGVFbnRpdHkifSwic2Vzc2lvbklkIjoyLCJ0ZWxlZ3JhbUlkIjoxMjM0NTY3ODksImJ1c2luZXNzSWQiOiJhZDVkYTY3Ny00NDY0LTQ3NDctYTA1OC01YzI5YWMxMmVjNjIiLCJpYXQiOjE3NzY0Mjc0MTUsImV4cCI6MTc3NjQyODMxNX0.-DKBmBohXDVrEU_FNJwJThWhkkVvkpkl-pttiIeZ3z4',
    }),
  clearToken: () => set({ token: null }),
}));
