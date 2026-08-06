import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardRequestsPage } from "./CardRequestsPage";
import { renderWithDb } from "@/test/harness";
import { makeClient, makePet, makeRegistration } from "@/test/factories";
import type { Pet } from "@/types";

const CLIENT = makeClient({ id: 1, name: "Jan Enrico" });
const BRANCHES = [
  {
    id: 1,
    name: "Pet Hub Veterinary Hospital — Angeles",
    email: "a@example.com",
    location: "Angeles",
  },
];

/** A pet whose owner has availed a card that is awaiting release. */
const pendingPet = (overrides: Partial<Pet> = {}) =>
  makePet({
    id: 10,
    clientId: 1,
    name: "Koohii",
    hasCard: true,
    printStatus: "Pending",
    membershipNo: "",
    ...overrides,
  });

function setup(seed: Parameters<typeof renderWithDb>[1] = {}) {
  const view = renderWithDb((db) => <CardRequestsPage db={db} />, {
    clients: [CLIENT],
    branches: BRANCHES,
    pets: [pendingPet()],
    ...seed,
  });
  return { ...view, user: userEvent.setup() };
}

describe("pending queue", () => {
  it("lists pets whose card is awaiting release", async () => {
    setup();
    expect(screen.getByText("1 pending")).toBeInTheDocument();
    expect(screen.getByText(/Koohii/)).toBeInTheDocument();
  });

  it("excludes pets whose card is already printed", () => {
    setup({ pets: [pendingPet({ printStatus: "Printed" })] });
    expect(screen.getByText("0 pending")).toBeInTheDocument();
    expect(screen.getByText(/No pending card requests/)).toBeInTheDocument();
  });

  it("excludes pets with no card at all", () => {
    setup({ pets: [pendingPet({ hasCard: false })] });
    expect(screen.getByText("0 pending")).toBeInTheDocument();
  });

  it("filters the queue by branch", async () => {
    const { user } = setup({
      pets: [
        pendingPet({ id: 10, name: "Koohii" }),
        pendingPet({
          id: 11,
          name: "Bruno",
          branch: "Pet Hub Veterinary Clinic — Bacoor",
        }),
      ],
      branches: [
        ...BRANCHES,
        {
          id: 2,
          name: "Pet Hub Veterinary Clinic — Bacoor",
          email: "b@example.com",
          location: "Bacoor",
        },
      ],
    });

    expect(screen.getByText("2 pending")).toBeInTheDocument();

    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      "Pet Hub Veterinary Clinic — Bacoor",
    );

    expect(screen.getByText("1 pending")).toBeInTheDocument();
    expect(screen.getByText(/Bruno/)).toBeInTheDocument();
    expect(screen.queryByText(/Koohii/)).not.toBeInTheDocument();
  });
});

describe("releasing a card", () => {
  it("requires a membership number before the card can be released", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Release Card/ }));

    const confirm = screen
      .getAllByRole("button", { name: /Release Card/ })
      .at(-1)!;
    expect(confirm).toBeDisabled();
  });

  it("marks the card printed and stores the membership number", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Release Card/ }));

    await user.type(screen.getByPlaceholderText("e.g. PH-0027"), "PH-0027");
    await user.click(
      screen.getAllByRole("button", { name: /Release Card/ }).at(-1)!,
    );

    // Released pets leave the pending queue.
    expect(screen.getByText("0 pending")).toBeInTheDocument();
    expect(screen.getByText(/Loyalty card released/)).toBeInTheDocument();
  });

  it("shows the owner's details in the release dialog", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Release Card/ }));

    expect(screen.getByText("Jan Enrico")).toBeInTheDocument();
    expect(screen.getByText(CLIENT.contact)).toBeInTheDocument();
  });
});

describe("declining a request", () => {
  it("clears the card so the pet drops out of the queue", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Decline/ }));

    expect(screen.getByText("0 pending")).toBeInTheDocument();
    expect(screen.getByText(/Request declined/)).toBeInTheDocument();
  });
});

describe("newly approved clients", () => {
  it("counts the cards already issued to each new client's pets", () => {
    setup({
      registrations: [
        makeRegistration({
          email: CLIENT.email,
          name: CLIENT.name,
          accountType: "Client",
          status: "Approved",
          branch: BRANCHES[0].name,
        }),
      ],
      pets: [
        pendingPet({ id: 10 }),
        makePet({ id: 11, clientId: 1, hasCard: false }),
      ],
    });

    expect(screen.getByText("1 approved")).toBeInTheDocument();
    expect(screen.getByText("1/2 cards")).toBeInTheDocument();
  });

  it("ignores staff registrations", () => {
    setup({
      registrations: [
        makeRegistration({ accountType: "Staff", status: "Approved" }),
      ],
    });
    expect(screen.getByText("0 approved")).toBeInTheDocument();
  });
});
