const GMT_PLUS_4_OFFSET_MS = 4 * 60 * 60 * 1000;

export function getAppToday(): string {
  const now = new Date();
  const localTime = new Date(now.getTime() + GMT_PLUS_4_OFFSET_MS);
  return localTime.toISOString().split('T')[0];
}
