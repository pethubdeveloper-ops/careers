import { describe, expect, it } from "vitest";
import { petQrFilename, petQrValue } from "./petQr";
import { makePet } from "@/test/factories";

describe("petQrValue", () => {
  it("encodes the membership number when the pet has one", () => {
    expect(petQrValue(makePet({ id: 7, membershipNo: "PH-0027" }))).toBe(
      "PH-0027",
    );
  });

  it("falls back to the pet id, which the scanner also accepts", () => {
    expect(petQrValue(makePet({ id: 7, membershipNo: "" }))).toBe("7");
  });

  it("is empty for no pet, so nothing is rendered", () => {
    expect(petQrValue(null)).toBe("");
  });
});

describe("petQrFilename", () => {
  it("names the file after the pet and its membership number", () => {
    expect(
      petQrFilename(makePet({ id: 7, name: "Koohii", membershipNo: "PH-0027" })),
    ).toBe("QR-Koohii-PH-0027.png");
  });

  it("keeps a two-word name in one piece", () => {
    expect(
      petQrFilename(makePet({ id: 7, name: "Sir Barks", membershipNo: "" })),
    ).toBe("QR-Sir-Barks-7.png");
  });

  it("still produces a usable name for an unnamed pet", () => {
    expect(petQrFilename(makePet({ id: 7, name: "", membershipNo: "" }))).toBe(
      "QR-pet-7.png",
    );
  });
});
