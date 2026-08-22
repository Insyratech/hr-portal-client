import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Permission } from '@/types/permissions';

type PermissionsState = {
  permissions: Permission[];
};

const initialState: PermissionsState = {
  permissions: [],
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload;
    },
    clearPermissions: (state) => {
      state.permissions = [];
    },
  },
});

export const { setPermissions, clearPermissions } = permissionsSlice.actions;
export const permissionsReducer = permissionsSlice.reducer;
