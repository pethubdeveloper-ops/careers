import { describe, expect, it } from "vitest";
import { DATA_VERSION, STORAGE_KEYS, resetStaleData } from "./persist";

const VERSION_KEY = "pethub_data_version";

describe("resetStaleData", () => {
  it("clears cached records the first time a new data version runs", () => {
    localStorage.setItem(STORAGE_KEYS.clients, '[{"id":1}]');
    localStorage.setItem(STORAGE_KEYS.pets, '[{"id":2}]');
    localStorage.setItem(STORAGE_KEYS.transactions, '[{"id":3}]');

    resetStaleData();

    expect(localStorage.getItem(STORAGE_KEYS.clients)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.pets)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.transactions)).toBeNull();
    expect(localStorage.getItem(VERSION_KEY)).toBe(DATA_VERSION);
  });

  it("keeps the signed-in session so an update does not log anyone out", () => {
    localStorage.setItem(STORAGE_KEYS.auth, "true");
    localStorage.setItem(STORAGE_KEYS.user, '{"email":"admin@pethub.ph"}');
    localStorage.setItem(STORAGE_KEYS.clients, '[{"id":1}]');

    resetStaleData();

    expect(localStorage.getItem(STORAGE_KEYS.auth)).toBe("true");
    expect(localStorage.getItem(STORAGE_KEYS.user)).toContain(
      "admin@pethub.ph",
    );
    expect(localStorage.getItem(STORAGE_KEYS.clients)).toBeNull();
  });

  it("leaves unrelated keys from other apps alone", () => {
    localStorage.setItem("some_other_app", "keep me");

    resetStaleData();

    expect(localStorage.getItem("some_other_app")).toBe("keep me");
  });

  it("does not wipe work saved after the version was already recorded", () => {
    resetStaleData();
    localStorage.setItem(STORAGE_KEYS.clients, '[{"id":99}]');

    resetStaleData();

    expect(localStorage.getItem(STORAGE_KEYS.clients)).toBe('[{"id":99}]');
  });
});
