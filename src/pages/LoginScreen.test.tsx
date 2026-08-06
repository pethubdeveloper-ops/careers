import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "./LoginScreen";
import { SUPER_ADMIN } from "@/lib/constants";
import { makeClient, makeRegistration } from "@/test/factories";
import type { Admin, AuthUser } from "@/types";

const ADMIN: Admin = {
  email: SUPER_ADMIN,
  name: "Jeremiah Munoz",
  role: "Administrator",
};

const CLIENT = makeClient({ email: "owner@example.com", name: "Jan Enrico" });

const BRANCH = {
  id: 1,
  name: "Pet Hub Veterinary Clinic — Bacoor",
  email: "b@example.com",
  location: "Bacoor",
};

function setup(registrations = [] as ReturnType<typeof makeRegistration>[]) {
  const onLogin = vi.fn<(u: AuthUser) => void>();
  const onRegister = vi.fn();
  render(
    <LoginScreen
      onLogin={onLogin}
      onRegister={onRegister}
      admins={[ADMIN]}
      registrations={registrations}
      clients={[CLIENT]}
      branches={[BRANCH]}
      pets={[]}
    />,
  );
  return { onLogin, onRegister, user: userEvent.setup() };
}

async function signIn(user: ReturnType<typeof userEvent.setup>, email: string) {
  const emailField = screen.getByPlaceholderText("you@pethub.ph");
  await user.clear(emailField);
  await user.type(emailField, email);
  await user.type(
    screen.getByPlaceholderText("Enter your password"),
    "anything",
  );
  await user.click(screen.getByRole("button", { name: "Sign In" }));
}

describe("sign in", () => {
  it("routes a staff account to the admin portal", async () => {
    const { onLogin, user } = setup();
    await signIn(user, SUPER_ADMIN);

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: SUPER_ADMIN,
        role: "Administrator",
        isClient: false,
      }),
    );
  });

  it("routes a client email to the client portal and carries the client id", async () => {
    const { onLogin, user } = setup();
    await signIn(user, CLIENT.email);

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: CLIENT.email,
        role: "Client",
        isClient: true,
        clientId: CLIENT.id,
      }),
    );
  });

  it("matches emails case-insensitively", async () => {
    const { onLogin, user } = setup();
    await signIn(user, "OWNER@EXAMPLE.COM");

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ isClient: true }),
    );
  });

  it("blocks a pending registration and says why", async () => {
    const reg = makeRegistration({ email: "pending@example.com" });
    const { onLogin, user } = setup([reg]);
    await signIn(user, reg.email);

    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/awaiting admin approval/i)).toBeInTheDocument();
  });

  it("blocks a denied registration and says why", async () => {
    const reg = makeRegistration({
      email: "denied@example.com",
      status: "Denied",
    });
    const { onLogin, user } = setup([reg]);
    await signIn(user, reg.email);

    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/denied by the administrator/i)).toBeInTheDocument();
  });

  it("lets an approved staff registration in with its requested role", async () => {
    const reg = makeRegistration({
      email: "approved@example.com",
      status: "Approved",
      role: "Branch Manager",
    });
    const { onLogin, user } = setup([reg]);
    await signIn(user, reg.email);

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ role: "Branch Manager", isClient: false }),
    );
  });

  it("sends an approved client registration to the client portal", async () => {
    const reg = makeRegistration({
      email: "newclient@example.com",
      status: "Approved",
      accountType: "Client",
      role: "Client",
    });
    const { onLogin, user } = setup([reg]);
    await signIn(user, reg.email);

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ isClient: true }),
    );
  });

  it("rejects an unknown email", async () => {
    const { onLogin, user } = setup();
    await signIn(user, "nobody@example.com");

    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/no account found/i)).toBeInTheDocument();
  });

  it("requires both fields", async () => {
    const { onLogin, user } = setup();
    const emailField = screen.getByPlaceholderText("you@pethub.ph");
    await user.clear(emailField);
    await user.type(emailField, SUPER_ADMIN);
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/enter your email and password/i)).toBeInTheDocument();
  });
});

describe("request access", () => {
  async function openRegister(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByText("Request access"));
  }

  /** Fills every required field, including the branch select (first combobox). */
  async function fillRegistration(
    user: ReturnType<typeof userEvent.setup>,
    email: string,
  ) {
    await user.type(
      screen.getByPlaceholderText("e.g. Juan Dela Cruz"),
      "Juan Dela Cruz",
    );
    await user.type(screen.getByPlaceholderText("you@pethub.ph"), email);
    await user.selectOptions(
      screen.getAllByRole("combobox")[0],
      BRANCH.name,
    );
    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "secret123",
    );
  }

  it("raises a Pending request that cannot sign in yet", async () => {
    const { onRegister, user } = setup();

    await openRegister(user);
    await fillRegistration(user, "new@example.com");
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        branch: BRANCH.name,
        status: "Pending",
        accountType: "Staff",
        role: "Branch Staff",
      }),
    );
  });

  it("records a client request as accountType Client", async () => {
    const { onRegister, user } = setup();

    await openRegister(user);
    await user.click(screen.getByText("Client"));
    await fillRegistration(user, "newclient@example.com");
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({ accountType: "Client", role: "Client" }),
    );
  });

  it("requires a branch before submitting", async () => {
    const { onRegister, user } = setup();

    await openRegister(user);
    await user.type(
      screen.getByPlaceholderText("e.g. Juan Dela Cruz"),
      "Juan Dela Cruz",
    );
    await user.type(
      screen.getByPlaceholderText("you@pethub.ph"),
      "new@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "secret123",
    );
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/complete all fields/i)).toBeInTheDocument();
  });

  it("refuses an email that already belongs to a client", async () => {
    const { onRegister, user } = setup();
    await openRegister(user);
    await fillRegistration(user, CLIENT.email);
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).not.toHaveBeenCalled();
    expect(
      screen.getByText(/already belongs to a client account/i),
    ).toBeInTheDocument();
  });

  it("refuses an email that already has admin access", async () => {
    const { onRegister, user } = setup();
    await openRegister(user);
    await fillRegistration(user, SUPER_ADMIN);
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/already has admin access/i)).toBeInTheDocument();
  });

  it("refuses an address the browser allows but we require a TLD for", async () => {
    // `type="email"` blocks obviously-malformed input natively, so the app's
    // own regex only ever sees values like this dotless domain.
    const { onRegister, user } = setup();
    await openRegister(user);
    await fillRegistration(user, "juan@localhost");
    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(onRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
  });
});
