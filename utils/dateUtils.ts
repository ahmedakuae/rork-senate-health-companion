const RESET_HOUR_UTC = 1; // 5:00 AM UTC+4 = 1:00 AM UTC

export function getAppToday(): string {
  const now = new Date();
  const adjusted = new Date(now.getTime() - RESET_HOUR_UTC * 60 * 60 * 1000);
  return adjusted.toISOString().split('T')[0];
}
