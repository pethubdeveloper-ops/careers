import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionScanner } from "./TransactionScanner";
import { renderWithDb } from "@/test/harness";
import { makeClient, makePet, makeTxn } from "@/test/factories";

const CLIENT = makeClient({ id: 1 });
const PET = makePet({ id: 10, clientId: 1, membershipNo: "PH-0001" });

/** PH-0001 starts with a balance of 10 points. */
function setup() {
  const view = renderWithDb((db) => <TransactionScanner db={db} />, {
    clients: [CLIENT],
    pets: [PET],
    transactions: [makeTxn({ petId: PET.id, pointsGained: 10 })],
    user: {
      email: "admin@pethub.ph",
      name: "Jeremiah Munoz",
      role: "Administrator",
      isClient: false,
    },
  });
  return { ...view, user: userEvent.setup() };
}

async function lookUp(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.type(screen.getByPlaceholderText("Scan QR Code Here"), code);
  await user.click(screen.getByRole("button", { name: /Look Up/ }));
}

async function openTxnForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Gain or redeem loyalty points"));
}

describe("pet lookup", () => {
  it("finds a pet by membership number", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");

    expect(screen.getByText("Loyalty Card Details")).toBeInTheDocument();
    expect(screen.getAllByText(/KOOHII/i).length).toBeGreaterThan(0);
  });

  it("finds a pet by name, case-insensitively", async () => {
    const { user } = setup();
    await lookUp(user, "koohii");

    expect(screen.getByText("Loyalty Card Details")).toBeInTheDocument();
  });

  it("reports an unknown code instead of showing a card", async () => {
    const { user } = setup();
    await lookUp(user, "PH-9999");

    expect(screen.getByText(/No record found/i)).toBeInTheDocument();
    expect(screen.queryByText("Loyalty Card Details")).not.toBeInTheDocument();
  });

  it("shows the pet's net point balance", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");

    expect(screen.getByText("Total Points:")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
  });
});

describe("earning points", () => {
  it("converts pesos to points at ₱300 = 1pt and records the transaction", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");
    await openTxnForm(user);

    await user.type(screen.getByPlaceholderText("e.g. 1500"), "1500");
    expect(screen.getByText(/\+5\s+pts/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Save & Gain Points/ }));
    expect(screen.getByText(/\+5 points gained/)).toBeInTheDocument();
  });

  it("floors a partial point", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");
    await openTxnForm(user);

    await user.type(screen.getByPlaceholderText("e.g. 1500"), "899");
    expect(screen.getByText(/\+2\s+pts/)).toBeInTheDocument();
  });
});

describe("redeeming points", () => {
  async function chooseRedeem(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByText("Redeem Points"));
  }

  it("blocks redeeming more points than the pet holds", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");
    await openTxnForm(user);
    await chooseRedeem(user);

    await user.type(screen.getByPlaceholderText("Max 10 pts"), "11");

    expect(screen.getByText(/Not enough points/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save & Redeem Points/ }),
    ).toBeDisabled();
  });

  it("allows redeeming the exact balance", async () => {
    const { user } = setup();
    await lookUp(user, "PH-0001");
    await openTxnForm(user);
    await chooseRedeem(user);

    await user.type(screen.getByPlaceholderText("Max 10 pts"), "10");

    expect(screen.queryByText(/Not enough points/)).not.toBeInTheDocument();
    expect(screen.getByText(/Remaining after redeem/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Save & Redeem Points/ }),
    );
    expect(screen.getByText(/10 points redeemed/)).toBeInTheDocument();
  });
});
