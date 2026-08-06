/**
 * Branch names are long ("Pet Hub Veterinary Clinic — Bacoor"). The design uses
 * two shortenings depending on how much room the surface has.
 */

/** Drops the chain prefix only: "Clinic — Bacoor". */
export function branchLabel(name: string | undefined): string {
  return (name || "").replace("Pet Hub Veterinary ", "");
}

/** Doctors bookable at a branch. */
export function vetsForBranch(
  branch: string | undefined,
  map: Record<string, string[]>,
): string[] {
  return (branch && map[branch]) || [];
}

/** Drops the chain prefix and the clinic/hospital qualifier: "Bacoor". */
export function shortBranch(name: string | undefined): string {
  return (name || "")
    .replace("Pet Hub Veterinary ", "")
    .replace("Clinic — ", "")
    .replace("Hospital — ", "");
}
