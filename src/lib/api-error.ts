export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const message = (error as { data?: { error?: { message?: string } } }).data?.error?.message;
    if (message) {
      return message;
    }
  }
  return fallback;
}
