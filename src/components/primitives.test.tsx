import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./primitives";

/**
 * A dialog must always have a way out that does not depend on reaching a
 * button: one taller than the window, or rendered in a frame sized to its
 * content, can put its close button off screen.
 */
describe("leaving a dialog", () => {
  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Pet" onClose={onClose}>
        body
      </Modal>,
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the backdrop is clicked", async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Pet" onClose={onClose}>
        body
      </Modal>,
    );

    await userEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays open when the dialog itself is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Pet" onClose={onClose}>
        <p>body</p>
      </Modal>,
    );

    await userEvent.click(screen.getByText("body"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismisses one dialog at a time when they are stacked", async () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <>
        <Modal title="Outer" onClose={closeOuter}>
          outer
        </Modal>
        <Modal title="Inner" onClose={closeInner}>
          inner
        </Modal>
      </>,
    );

    await userEvent.keyboard("{Escape}");
    expect(closeInner).toHaveBeenCalledOnce();
    expect(closeOuter).not.toHaveBeenCalled();
  });
});
