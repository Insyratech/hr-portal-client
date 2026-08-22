'use client';

import { useAppDispatch } from '@/store/hooks';
import { pushToast } from '@/store/slices/toast-slice';

export function useToast() {
  const dispatch = useAppDispatch();

  return {
    success(message: string) {
      dispatch(pushToast({ tone: 'success', message }));
    },
    error(message: string) {
      dispatch(pushToast({ tone: 'error', message }));
    },
    warning(message: string) {
      dispatch(pushToast({ tone: 'warning', message }));
    },
  };
}
