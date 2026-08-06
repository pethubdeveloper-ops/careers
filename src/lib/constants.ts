/**
 * The date the app treats as "today".
 *
 * The prototype pinned this so the seeded reminders, expiries and upcoming
 * visits always look realistic. Swap for `new Date()` once real data lands.
 */
export const TODAY = "2026-07-01";

/** Only this account may review account-access requests. */
export const SUPER_ADMIN = "admin@pethub.ph";

/** Loyalty cards expire this many years after their membership date. */
export const CARD_VALIDITY_YEARS = 1;

/** A card within this many days of expiry counts as "near expiring". */
export const NEAR_EXPIRY_DAYS = 60;
