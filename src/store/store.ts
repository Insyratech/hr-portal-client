import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/store/api/api';
import { authReducer } from '@/store/slices/auth-slice';
import { permissionsReducer } from '@/store/slices/permissions-slice';
import { uiReducer } from '@/store/slices/ui-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    permissions: permissionsReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
