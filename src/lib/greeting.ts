/**
 * Greeting for a 0–23 local hour.
 * Morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59.
 */
export function greetingForHour(hour: number): string {
  if (hour >= 21 || hour < 5) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function greetingWithName(greeting: string, fullName: string | null | undefined): string {
  const firstName = fullName?.trim().split(' ')[0];
  return firstName ? `${greeting}, ${firstName}` : greeting;
}
