import { useState } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PetDetailsModal } from "./PetDetailsModal";
import { makeClient, makePet } from "@/test/factories";
import type { Pet } from "@/types";

// The code is drawn on a canvas, which jsdom does not implement. The drawing
// itself is verified in a real browser; here we only care about the wiring.
vi.mock("@/lib/petQr", async () => {
  const actual = await vi.importActual<typeof import("@/lib/petQr")>(
    "@/lib/petQr",
  );
  return { ...actual, petQrPng: vi.fn(async () => "data:image/png;base64,aGk=") };
});

const mocks = vi.hoisted(() => ({
  downloadDataUrl: vi.fn(async () => {}),
  copyImageToClipboard: vi.fn(async () => {}),
}));

vi.mock("@/lib/files", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/files")>("@/lib/files");
  return { ...actual, ...mocks };
});

const CLIENT = makeClient({ id: 1, name: "Jan Enrico" });
const PET = makePet({
  id: 10,
  clientId: 1,
  name: "Koohii",
  membershipNo: "PH-0027",
});

function setup() {
  function Harness() {
    const [pets, setPets] = useState<Pet[]>([PET]);
    return (
      <PetDetailsModal
        client={CLIENT}
        pets={pets}
        setPets={setPets}
        onClose={() => {}}
      />
    );
  }
  render(<Harness />);
  return { user: userEvent.setup() };
}

beforeEach(() => {
  mocks.downloadDataUrl.mockReset().mockResolvedValue(undefined);
  mocks.copyImageToClipboard.mockReset().mockResolvedValue(undefined);
});

describe("the pet's QR code", () => {
  it("saves it as a PNG named after the pet", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(mocks.downloadDataUrl).toHaveBeenCalledWith(
      "data:image/png;base64,aGk=",
      "QR-Koohii-PH-0027.png",
    );
    expect(await screen.findByText("QR code saved.")).toBeInTheDocument();
  });

  it("copies it to the clipboard", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Copy/ }));

    expect(mocks.copyImageToClipboard).toHaveBeenCalledWith(
      "data:image/png;base64,aGk=",
    );
    expect(await screen.findByText("QR code copied.")).toBeInTheDocument();
  });

  it("says why a copy failed rather than doing nothing", async () => {
    mocks.copyImageToClipboard.mockRejectedValue(
      new Error("Copying was blocked here. Download it instead."),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Copy/ }));

    expect(await screen.findByText(/Copying was blocked/)).toBeInTheDocument();
  });

  it("says why a save failed rather than doing nothing", async () => {
    mocks.downloadDataUrl.mockRejectedValue(new Error("Could not save the file."));
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(await screen.findByText("Could not save the file.")).toBeInTheDocument();
  });
});

describe("leaving the dialog", () => {
  it("closes on Escape, which no amount of scrolling can hide", async () => {
    const onClose = vi.fn();
    render(
      <PetDetailsModal
        client={CLIENT}
        pets={[PET]}
        setPets={() => {}}
        onClose={onClose}
      />,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <PetDetailsModal
        client={CLIENT}
        pets={[PET]}
        setPets={() => {}}
        onClose={onClose}
      />,
    );

    // The overlay renders into the body, not beside the caller.
    await userEvent.click(
      document.querySelector("[data-dialog-backdrop]")!,
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
