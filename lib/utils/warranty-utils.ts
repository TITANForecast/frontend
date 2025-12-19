/**
 * Calculate the eligible date for warranty submission based on cooldown settings
 *
 * @param lastSubmission - The date of the last submission (ISO string or Date)
 * @param cooldownPeriod - The cooldown period in days
 * @param cooldownPerCalendarYear - Whether cooldown is per calendar year
 * @returns The eligible date as a Date object
 */
export function calculateEligibleDate(
  lastSubmission: string | Date | null,
  cooldownPeriod: number,
  cooldownPerCalendarYear: boolean
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (cooldownPerCalendarYear && lastSubmission) {
    // If per calendar year is enabled, set eligible date to Jan 1 of next year
    const lastSub = new Date(lastSubmission);
    const nextYear = lastSub.getFullYear() + 1;
    return new Date(nextYear, 0, 1); // January 1st of next year
  } else if (lastSubmission) {
    // Use cooldown period in days
    const lastSub = new Date(lastSubmission);
    lastSub.setHours(0, 0, 0, 0);
    const eligibleDate = new Date(lastSub);
    eligibleDate.setDate(eligibleDate.getDate() + cooldownPeriod);
    return eligibleDate;
  } else {
    // If no submission date, use today + cooldown as default
    const eligibleDate = new Date(today);
    eligibleDate.setDate(eligibleDate.getDate() + cooldownPeriod);
    return eligibleDate;
  }
}
