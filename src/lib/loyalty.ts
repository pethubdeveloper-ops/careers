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

/** Net loyalty points a pet currently holds. */
export function pointsForPet(petId: number, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.petId === petId)
    .reduce((sum, t) => sum + (t.pointsGained || 0) - (t.pointsUsed || 0), 0);
}
