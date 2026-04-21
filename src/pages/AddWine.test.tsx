import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddWine from "./AddWine";

const addWine = vi.fn();
const addWishlistItem = vi.fn();
const navigate = vi.fn();
const toast = vi.fn();

vi.mock("@/hooks/useWineStore", () => ({
  useWineStore: () => ({
    addWine,
    addWishlistItem,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: unknown }) => <div>{children}</div>,
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

describe("AddWine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits cellar entries from the external save button", () => {
    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Testkellerei" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ins Lager aufnehmen" })[0]);

    expect(addWine).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Barolo Test",
        producer: "Testkellerei",
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/cellar");
    expect(addWishlistItem).not.toHaveBeenCalled();
  });

  it("submits wishlist entries from the external save button", () => {
    render(<AddWine />);

    fireEvent.click(screen.getByRole("button", { name: /Nur Registrieren/i }));
    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Chianti Classico" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Castello Test" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Registrieren" })[0]);

    expect(addWishlistItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Chianti Classico",
        producer: "Castello Test",
        source: "add-wine",
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/wishlist");
    expect(addWine).not.toHaveBeenCalled();
  });
});
