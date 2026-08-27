import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  entityDrawer: {
    open: boolean;
    title: string;
    body: string;
    leaveId: string | null;
    leaveStatus: string | null;
    grievanceId: string | null;
    handoverAccepted: boolean;
  };
  confirmDialog: {
    open: boolean;
    title: string;
    description: string;
    action: 'close' | 'logout';
  };
};

const initialState: UiState = {
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  notificationsOpen: false,
  entityDrawer: {
    open: false,
    title: '',
    body: '',
    leaveId: null,
    leaveStatus: null,
    grievanceId: null,
    handoverAccepted: true,
  },
  confirmDialog: {
    open: false,
    title: '',
    description: '',
    action: 'close',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    openEntityDrawer: (
      state,
      action: PayloadAction<{
        title: string;
        body: string;
        leaveId?: string;
        leaveStatus?: string;
        grievanceId?: string;
        handoverAccepted?: boolean;
      }>,
    ) => {
      state.entityDrawer = {
        open: true,
        title: action.payload.title,
        body: action.payload.body,
        leaveId: action.payload.leaveId ?? null,
        leaveStatus: action.payload.leaveStatus ?? null,
        grievanceId: action.payload.grievanceId ?? null,
        handoverAccepted: action.payload.handoverAccepted ?? true,
      };
    },
    closeEntityDrawer: (state) => {
      state.entityDrawer.open = false;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    setNotificationsOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationsOpen = action.payload;
    },
    toggleNotificationsOpen: (state) => {
      state.notificationsOpen = !state.notificationsOpen;
    },
    openConfirmDialog: (
      state,
      action: PayloadAction<{
        title: string;
        description: string;
        action?: 'close' | 'logout';
      }>,
    ) => {
      state.confirmDialog = {
        open: true,
        title: action.payload.title,
        description: action.payload.description,
        action: action.payload.action ?? 'close',
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog.open = false;
    },
  },
});

export const {
  toggleSidebar,
  toggleCommandPalette,
  setCommandPaletteOpen,
  setNotificationsOpen,
  toggleNotificationsOpen,
  openEntityDrawer,
  closeEntityDrawer,
  openConfirmDialog,
  closeConfirmDialog,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
