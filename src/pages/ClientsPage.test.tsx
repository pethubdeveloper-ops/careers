import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientsPage } from "./ClientsPage";
import { renderWithDb } from "@/test/harness";
import { makeClient } from "@/test/factories";

const ID_DATA = "data:image/png;base64,aWQ=";

function setup(seed: Parameters<typeof renderWithDb>[1] = {}) {
  const view = renderWithDb((db) => <ClientsPage db={db} />, {
    clients: [
      makeClient({
        id: 1,
        name: "Maria Santos",
        idImage: ID_DATA,
        idName: "umid.png",
        idType: "image/png",
      }),
    ],
    pets: [],
    branches: [],
    ...seed,
  });
  return { ...view, user: userEvent.setup() };
}

describe("ID in the client directory", () => {
  it("shows each client's ID in the list", () => {
    setup();
    expect(
      screen.getByAltText("ID submitted by Maria Santos"),
    ).toBeInTheDocument();
  });

  it("opens the ID full size with a download", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Open Maria/ }));

    expect(screen.getByText("ID — Maria Santos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/ })).toHaveAttribute(
      "download",
      "umid.png",
    );
  });

  it("says so in words when a client has no ID, and offers to add one", async () => {
    const { user } = setup({
      clients: [makeClient({ id: 2, name: "No Doc", idImage: null })],
    });

    expect(screen.getByText("No ID")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Open No Doc/ }),
    ).not.toBeInTheDocument();

    // Clicking it opens that client's editor, where the upload lives.
    await user.click(screen.getByRole("button", { name: /Add an ID for No Doc/ }));
    expect(screen.getByRole("button", { name: "Upload ID" })).toBeInTheDocument();
  });

  it("surfaces the ID on file when editing a client", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Edit/ }));

    expect(screen.getByText("umid.png")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Replace" }),
    ).toBeInTheDocument();
  });

  it("offers an upload for a client with no ID yet", async () => {
    const { user } = setup({
      clients: [makeClient({ id: 2, name: "No Doc", idImage: null })],
    });
    await user.click(screen.getByRole("button", { name: /Edit/ }));

    expect(screen.getByText("No ID on file")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload ID" }),
    ).toBeInTheDocument();
  });
});
