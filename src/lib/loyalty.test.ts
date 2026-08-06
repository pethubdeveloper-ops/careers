import { describe, expect, it } from "vitest";
import {
  cardExpiry,
  daysUntilExpiry,
  isExpired,
  isNearExpiring,
  parseMembershipDate,
  pointsForPet,
} from "./loyalty";
import { NEAR_EXPIRY_DAYS, TODAY } from "./constants";
import { makePet, makeTxn, membershipDateExpiringIn } from "@/test/factories";

describe("parseMembershipDate", () => {
  it("parses the MM/DD/YYYY format the prototype stores", () => {
    expect(parseMembershipDate("05/26/2025")?.toISOString()).toBe(
      "2025-05-26T00:00:00.000Z",
    );
  });

  it("returns null for missing or malformed values", () => {
    expect(parseMembershipDate(undefined)).toBeNull();
    expect(parseMembershipDate("")).toBeNull();
    expect(parseMembershipDate("2025-05-26")).toBeNull();
    expect(parseMembershipDate("not/a/date")).toBeNull();
  });
});

describe("cardExpiry", () => {
  it("lapses exactly one year after the membership date", () => {
    const pet = makePet({ membershipDate: "05/26/2025" });
    expect(cardExpiry(pet)?.toISOString()).toBe("2026-05-26T00:00:00.000Z");
  });

  it("is null when the pet has no membership date", () => {
    expect(cardExpiry(makePet({ membershipDate: "" }))).toBeNull();
  });
});

describe("daysUntilExpiry", () => {
  it("is negative once the card has lapsed", () => {
    // 2025-05-26 + 1yr = 2026-05-26, which is 36 days before 2026-07-01.
    const pet = makePet({ membershipDate: "05/26/2025" });
    expect(daysUntilExpiry(pet, TODAY)).toBe(-36);
  });

  it("counts forward for a card still in force", () => {
    const pet = makePet({ membershipDate: "08/22/2025" });
    expect(daysUntilExpiry(pet, TODAY)).toBe(52);
  });

  it("returns null when there is no membership date to measure from", () => {
    expect(daysUntilExpiry(makePet({ membershipDate: "" }), TODAY)).toBeNull();
  });
});

describe("expiry classification", () => {
  it("treats a card expiring today as expired, not near-expiring", () => {
    const pet = makePet({ membershipDate: membershipDateExpiringIn(0) });
    expect(daysUntilExpiry(pet, TODAY)).toBe(0);
    expect(isExpired(pet, TODAY)).toBe(true);
    expect(isNearExpiring(pet, TODAY)).toBe(false);
  });

  it("includes the 60-day boundary in near-expiring", () => {
    const pet = makePet({
      membershipDate: membershipDateExpiringIn(NEAR_EXPIRY_DAYS),
    });
    expect(daysUntilExpiry(pet, TODAY)).toBe(NEAR_EXPIRY_DAYS);
    expect(isNearExpiring(pet, TODAY)).toBe(true);
    expect(isExpired(pet, TODAY)).toBe(false);
  });

  it("excludes a card one day beyond the boundary", () => {
    const pet = makePet({
      membershipDate: membershipDateExpiringIn(NEAR_EXPIRY_DAYS + 1),
    });
    expect(isNearExpiring(pet, TODAY)).toBe(false);
    expect(isExpired(pet, TODAY)).toBe(false);
  });

  it("classifies a pet with no membership date as neither", () => {
    const pet = makePet({ membershipDate: "" });
    expect(isExpired(pet, TODAY)).toBe(false);
    expect(isNearExpiring(pet, TODAY)).toBe(false);
  });
});

describe("pointsForPet", () => {
  const txns = [
    makeTxn({ petId: 1, pointsGained: 16 }),
    makeTxn({ petId: 1, pointsGained: 1 }),
    makeTxn({ petId: 1, pointsGained: 5 }),
    makeTxn({ petId: 1, pointsGained: 10, pointsUsed: 8 }),
    makeTxn({ petId: 2, pointsGained: 99 }),
  ];

  it("nets redemptions against earnings for one pet only", () => {
    expect(pointsForPet(1, txns)).toBe(24);
  });

  it("ignores other pets' transactions", () => {
    expect(pointsForPet(2, txns)).toBe(99);
  });

  it("is zero for a pet with no transactions", () => {
    expect(pointsForPet(999, txns)).toBe(0);
  });
});
