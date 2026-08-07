import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsPage } from "./AccountsPage";
import { renderWithDb } from "@/test/harness";
import { makeRegistration } from "@/test/factories";
import { SUPER_ADMIN } from "@/lib/constants";
import type { AuthUser } from "@/types";

const ADMIN: AuthUser = {
  email: SUPER_ADMIN,
  name: "Jeremiah Munoz",
  role: "Administrator",
  isClient: false,
};

const ID_DATA = "data:image/png;base64,aWQ=";

const withId = (overrides = {}) =>
  makeRegistration({
    name: "Juan Dela Cruz",
    email: "juan@example.com",
    idImage: ID_DATA,
    idName: "drivers-licence.png",
    idType: "image/png",
    ...overrides,
  });

function setup(seed: Parameters<typeof renderWithDb>[1] = {}) {
  const view = renderWithDb((db) => <AccountsPage db={db} />, {
    user: ADMIN,
    branches: [],
    accounts: [],
    registrations: [withId()],
    ...seed,
  });
  return { ...view, user: userEvent.setup() };
}

describe("reviewing a request's ID", () => {
  it("shows the submitted ID next to the request", () => {
    setup();
    expect(
      screen.getByAltText("ID submitted by Juan Dela Cruz"),
    ).toBeInTheDocument();
  });

  it("opens the ID full size for checking", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /View ID/ }));

    expect(screen.getByText("ID — Juan Dela Cruz")).toBeInTheDocument();
    expect(
      screen.getByText(/Check the name and photo match/i),
    ).toBeInTheDocument();
  });

  it("can approve straight from the ID view", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /View ID/ }));
    // The card behind the modal has its own Approve; take the modal's.
    await user.click(
      screen.getAllByRole("button", { name: /Approve/ }).at(-1)!,
    );

    expect(screen.getByText(/added to Accounts/i)).toBeInTheDocument();
    expect(screen.getByText("All reviewed")).toBeInTheDocument();
  });

  it("can deny straight from the ID view", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /View ID/ }));
    await user.click(screen.getAllByRole("button", { name: /Deny/ }).at(-1)!);

    expect(screen.getByText(/request denied/i)).toBeInTheDocument();
  });

  it("flags a request that carries no ID rather than hiding it", () => {
    setup({ registrations: [makeRegistration({ idImage: null })] });

    expect(screen.getByText("No ID")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /View ID/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the whole panel from non-super-admins", () => {
    setup({
      user: { ...ADMIN, email: "pethubbacoor@gmail.com" },
    });

    expect(
      screen.queryByText("Account Access Requests"),
    ).not.toBeInTheDocument();
  });
});
