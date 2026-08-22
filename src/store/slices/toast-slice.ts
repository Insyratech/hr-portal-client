import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastTone = 'success' | 'error' | 'warning';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  message: string;
};

type ToastState = {
  items: ToastItem[];
};

const initialState: ToastState = {
  items: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    pushToast: (state, action: PayloadAction<{ tone: ToastTone; message: string }>) => {
      state.items.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        tone: action.payload.tone,
        message: action.payload.message,
      });
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export const toastReducer = toastSlice.reducer;
