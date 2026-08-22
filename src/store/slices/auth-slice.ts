import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
  employeeId: string;
  authUserId: string;
  name: string;
  email: string;
  roles: string[];
};

type AuthState = {
  hydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
};

const initialState: AuthState = {
  hydrated: false,
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.hydrated = action.payload;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    setSession: (state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.hydrated = true;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
      state.hydrated = true;
    },
  },
});

export const { setHydrated, setAccessToken, setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
