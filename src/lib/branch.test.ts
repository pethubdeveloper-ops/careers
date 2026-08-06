import { describe, expect, it } from "vitest";
import { branchLabel, shortBranch, vetsForBranch } from "./branch";

const CLINIC = "Pet Hub Veterinary Clinic — Bacoor";
const HOSPITAL = "Pet Hub Veterinary Hospital — Angeles";

describe("branchLabel", () => {
  it("drops only the chain prefix", () => {
    expect(branchLabel(CLINIC)).toBe("Clinic — Bacoor");
    expect(branchLabel(HOSPITAL)).toBe("Hospital — Angeles");
  });

  it("is empty for a missing branch", () => {
    expect(branchLabel(undefined)).toBe("");
  });
});

describe("shortBranch", () => {
  it("drops the chain prefix and the clinic/hospital qualifier", () => {
    expect(shortBranch(CLINIC)).toBe("Bacoor");
    expect(shortBranch(HOSPITAL)).toBe("Angeles");
  });

  it("leaves an unrecognised name untouched", () => {
    expect(shortBranch("Some Other Vet")).toBe("Some Other Vet");
  });

  it("is empty for a missing branch", () => {
    expect(shortBranch(undefined)).toBe("");
  });
});

describe("vetsForBranch", () => {
  const map = { [CLINIC]: ["Dr. Fogata", "Dr. Antonio"] };

  it("returns the branch's doctors", () => {
    expect(vetsForBranch(CLINIC, map)).toEqual(["Dr. Fogata", "Dr. Antonio"]);
  });

  it("returns an empty list for an unknown or missing branch", () => {
    expect(vetsForBranch(HOSPITAL, map)).toEqual([]);
    expect(vetsForBranch(undefined, map)).toEqual([]);
  });
});
