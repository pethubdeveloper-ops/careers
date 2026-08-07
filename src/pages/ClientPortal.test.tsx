import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientPortal } from "./ClientPortal";
import { renderWithDb } from "@/test/harness";
import { makeClient, makePet } from "@/test/factories";
import type { AuthUser } from "@/types";

const CLIENT = makeClient({ id: 1, name: "Jan Enrico" });

const USER: AuthUser = {
  email: CLIENT.email,
  name: CLIENT.name,
  role: "Client",
  isClient: true,
  clientId: CLIENT.id,
};

/** A pet with no loyalty card yet — the state that offers "Avail". */
const cardless = () =>
  makePet({
    id: 10,
    clientId: 1,
    name: "Bruno",
    hasCard: false,
    printStatus: "N/A",
    membershipNo: "",
    photo: null,
  });

function setup(seed: Parameters<typeof renderWithDb>[1] = {}) {
  const view = renderWithDb(
    (db) => <ClientPortal user={USER} db={db} onLogout={() => {}} />,
    { clients: [CLIENT], pets: [cardless()], ...seed },
  );
  return { ...view, user: userEvent.setup() };
}

async function openMyPets(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /My Pets/ }));
}

/** The picker is hidden behind a styled button, so apply the file directly. */
async function choosePhoto() {
  const input = document.querySelector(
    'input[type="file"][accept="image/*"]',
  ) as HTMLInputElement;
  fireEvent.change(input, {
    target: {
      files: [new File(["photo-bytes"], "bruno.jpg", { type: "image/jpeg" })],
    },
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Choose a different photo/ }),
    ).toBeInTheDocument(),
  );
}

describe("availing a loyalty card", () => {
  it("asks for a photo instead of requesting the card straight away", async () => {
    const { user } = setup();
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));

    expect(
      screen.getByText("Avail Loyalty Card — Bruno"),
    ).toBeInTheDocument();
    expect(screen.getByText(/goes on the loyalty card/i)).toBeInTheDocument();
    // Still no card until a photo is provided.
    expect(screen.getByText("No Card")).toBeInTheDocument();
  });

  it("cannot submit the request without a photo", async () => {
    const { user } = setup();
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));

    expect(screen.getByRole("button", { name: /Request Card/ })).toBeDisabled();
  });

  it("requests the card once a photo is chosen", async () => {
    const { user } = setup();
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));
    await choosePhoto();

    const submit = screen.getByRole("button", { name: /Request Card/ });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(screen.getByText(/Loyalty card requested/i)).toBeInTheDocument();
    expect(
      screen.getByText(/pending release at your branch/i),
    ).toBeInTheDocument();
  });

  it("keeps the photo on the pet so it can go on the card", async () => {
    const { user } = setup();
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));
    await choosePhoto();
    await user.click(screen.getByRole("button", { name: /Request Card/ }));

    await waitFor(() =>
      expect(screen.getByAltText("Bruno")).toBeInTheDocument(),
    );
  });

  it("offers a pet's existing photo rather than asking again", async () => {
    const { user } = setup({
      pets: [makePet({ ...cardless(), photo: "data:image/png;base64,cGV0" })],
    });
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));

    expect(screen.getByRole("button", { name: /Request Card/ })).toBeEnabled();
  });

  it("abandons the request on cancel", async () => {
    const { user } = setup();
    await openMyPets(user);
    await user.click(screen.getByRole("button", { name: /Avail Loyalty Card/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByText("Avail Loyalty Card — Bruno"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("No Card")).toBeInTheDocument();
  });
});
