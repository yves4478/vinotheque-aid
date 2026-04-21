import { fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddWine from "./AddWine";

const addWineMock = vi.fn();
const addWishlistItemMock = vi.fn();
const toastMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock("@/components/WineLabelScanner", () => ({
  WineLabelScanner: () => <div data-testid="wine-label-scanner" />,
}));

vi.mock("@/components/GrapeSelector", () => ({
  GrapeSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <input
      aria-label="Rebsorte"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/hooks/useWineStore", () => ({
  useWineStore: () => ({
    addWine: addWineMock,
    addWishlistItem: addWishlistItemMock,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("AddWine", () => {
  beforeEach(() => {
    addWineMock.mockReset();
    addWishlistItemMock.mockReset();
    toastMock.mockReset();
    navigateMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("submits from the external 'Ins Lager aufnehmen' button", () => {
    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Riserva" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Conterno" },
    });

    const saveButton = screen.getAllByRole("button", { name: /^Ins Lager aufnehmen$/i })[0];
    expect(saveButton.closest("form")).toBeNull();

    fireEvent.click(saveButton);

    expect(addWineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Barolo Riserva",
        producer: "Conterno",
      }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ins Lager aufgenommen ✓",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/cellar");
  });

  it("shows a destructive toast when saving fails", () => {
    addWineMock.mockImplementation(() => {
      throw new Error("Speichern im Browser fehlgeschlagen");
    });

    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Riserva" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Conterno" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: /^Ins Lager aufnehmen$/i })[0]);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Speichern fehlgeschlagen",
        description: "Speichern im Browser fehlgeschlagen",
        variant: "destructive",
      }),
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("submits the register flow via the external button", () => {
    render(<AddWine />);

    fireEvent.click(screen.getByRole("button", { name: /Nur Registrieren/i }));
    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Riesling Smaragd" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Domäne Wachau" },
    });

    const registerButton = screen.getAllByRole("button", { name: /^Registrieren$/i })[0];
    expect(registerButton.closest("form")).toBeNull();

    fireEvent.click(registerButton);

    expect(addWishlistItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Riesling Smaragd",
        producer: "Domäne Wachau",
        source: "add-wine",
      }),
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Auf Merkliste ✓",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/wishlist");
  });
});
