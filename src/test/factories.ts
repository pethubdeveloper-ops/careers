import type { Client, Pet, Registration, Transaction } from "@/types";

let seq = 0;
const nextId = () => ++seq;

export function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: nextId(),
    clientId: 1,
    name: "Koohii",
    membershipNo: "PH-0001",
    photo: null,
    species: "Dog",
    breed: "Shiba Inu",
    gender: "Male",
    age: "3",
    weight: "8 kg",
    color: "Brown",
    birthday: "2023-01-15",
    notes: "",
    hasCard: true,
    branch: "Pet Hub Veterinary Hospital — Angeles",
    email: "owner@example.com",
    membershipDate: "05/26/2025",
    printStatus: "Printed",
    ...overrides,
  };
}

export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 1,
    branch: "Pet Hub Veterinary Hospital — Angeles",
    email: "owner@example.com",
    contact: "0917 000 0000",
    name: "Jan Enrico Resurreccion",
    status: "Active",
    ...overrides,
  };
}

export function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: nextId(),
    petId: 1,
    transactionId: "1",
    amount: 300,
    pointsGained: 1,
    pointsUsed: 0,
    transactBy: "Jeremiah Munoz",
    receipt: "—",
    date: "2026-06-01",
    ...overrides,
  };
}

export function makeRegistration(
  overrides: Partial<Registration> = {},
): Registration {
  return {
    id: nextId(),
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    branch: "Pet Hub Veterinary Clinic — Bacoor",
    accountType: "Staff",
    role: "Branch Staff",
    contact: "",
    password: "secret",
    status: "Pending",
    requestedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A membership date whose card expires `days` after `from`. */
export function membershipDateExpiringIn(days: number, from = "2026-07-01") {
  const exp = new Date(from);
  exp.setDate(exp.getDate() + days);
  const start = new Date(exp);
  start.setFullYear(start.getFullYear() - 1);
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${start.getFullYear()}`;
}
