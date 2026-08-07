import { CARD_VALIDITY_YEARS, NEAR_EXPIRY_DAYS, TODAY } from "./constants";
import type { Pet, Transaction } from "@/types";

/** Parses the prototype's MM/DD/YYYY membership dates. */
export function parseMembershipDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parts = String(value).split("/");
  if (parts.length !== 3) return null;
  const d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
  return isNaN(d.getTime()) ? null : d;
}

/** The date a pet's loyalty card lapses, or null if it has no membership date. */
export function cardExpiry(pet: Pet): Date | null {
  const start = parseMembershipDate(pet.membershipDate);
  if (!start) return null;
  const exp = new Date(start);
  exp.setFullYear(exp.getFullYear() + CARD_VALIDITY_YEARS);
  return exp;
}

/** Days until a pet's card expires. Negative once expired. */
export function daysUntilExpiry(pet: Pet, today: string = TODAY): number | null {
  const exp = cardExpiry(pet);
  if (!exp) return null;
  return Math.ceil(
    (exp.getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function isExpired(pet: Pet, today: string = TODAY): boolean {
  const days = daysUntilExpiry(pet, today);
  return days !== null && days <= 0;
}

export function isNearExpiring(pet: Pet, today: string = TODAY): boolean {
  const days = daysUntilExpiry(pet, today);
  return days !== null && days > 0 && days <= NEAR_EXPIRY_DAYS;
}

/**
 * The membership date a renewal writes, in the stored MM/DD/YYYY form.
 *
 * A card still in date has its term extended from where the old one ends, so
 * renewing early does not cost the client the months they have left. A lapsed
 * card starts a fresh term today. Both are done on the date parts rather than
 * by Date arithmetic, which keeps the result off the timezone boundary.
 */
export function renewedMembershipDate(
  pet: Pet,
  today: string = TODAY,
): string {
  const parts = String(pet.membershipDate ?? "").split("/");
  if (parts.length === 3 && !isExpired(pet, today)) {
    const [month, day, year] = parts;
    return `${month}/${day}/${Number(year) + CARD_VALIDITY_YEARS}`;
  }

  const [year, month, day] = today.split("-");
  return `${month}/${day}/${year}`;
}

/** Net loyalty points a pet currently holds. */
export function pointsForPet(petId: number, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.petId === petId)
    .reduce((sum, t) => sum + (t.pointsGained || 0) - (t.pointsUsed || 0), 0);
}
