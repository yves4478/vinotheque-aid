import { fireEvent, render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddWine from "./AddWine";

const addWineMock = vi.fn();
const addWishlistItemMock = vi.fn();
const addShoppingItemMock = vi.fn();
const addMerchantMock = vi.fn();
const toastMock = vi.fn();
const navigateMock = vi.fn();
let searchParamsMock = new URLSearchParams();
let merchantsMock: Array<{
  id: string;
  name: string;
  website?: string;
  location?: string;
  notes?: string;
  deals: [];
  createdAt: string;
}> = [];

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
    addShoppingItem: addShoppingItemMock,
    merchants: merchantsMock,
    addMerchant: addMerchantMock,
    wishlistItems: [],
    settings: {
      cellarName: "Testkeller",
      currency: "CHF",
      anthropicApiKey: undefined,
    },
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
    useSearchParams: () => [searchParamsMock, vi.fn()],
  };
});

function selectCountryAndRegion(country: string, region: string) {
  const findSelectWithOption = (value: string) => Array.from(document.querySelectorAll("select"))
    .find((select) => Array.from(select.options).some((option) => option.value === value));

  const countrySelect = findSelectWithOption(country);
  expect(countrySelect).toBeDefined();
  fireEvent.change(countrySelect!, { target: { value: country } });

  const regionSelect = findSelectWithOption(region);
  expect(regionSelect).toBeDefined();
  fireEvent.change(regionSelect!, { target: { value: region } });
}

describe("AddWine", () => {
  beforeEach(() => {
    addWineMock.mockReset();
    addWishlistItemMock.mockReset();
    addShoppingItemMock.mockReset();
    addMerchantMock.mockReset();
    toastMock.mockReset();
    navigateMock.mockReset();
    searchParamsMock = new URLSearchParams();
    merchantsMock = [];
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("submits a cellar wine from the save button", () => {
    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Riserva" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Conterno" },
    });
    selectCountryAndRegion("Italien", "Piemont");

    const saveButton = screen.getAllByRole("button", { name: /^Ins Lager aufnehmen$/i })[0];
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
    selectCountryAndRegion("Italien", "Piemont");

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
    searchParamsMock = new URLSearchParams("mode=merkliste&return=/wishlist");

    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Riesling Smaragd" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Domäne Wachau" },
    });
    selectCountryAndRegion("Österreich", "Wachau");

    const registerButton = screen.getAllByRole("button", { name: /^Registrieren$/i })[0];
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

  it("stores the canonical merchant name when an existing merchant is selected", () => {
    merchantsMock = [{
      id: "merchant-1",
      name: "Weinhandlung Kreis",
      location: "Zürich",
      deals: [],
      createdAt: "2026-05-08T00:00:00.000Z",
    }];

    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Riserva" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Conterno" },
    });
    selectCountryAndRegion("Italien", "Piemont");

    const merchantInput = screen.getByLabelText("Bezugsquelle");
    fireEvent.change(merchantInput, { target: { value: "kreis" } });
    fireEvent.click(screen.getByRole("option", { name: /Weinhandlung Kreis/i }));

    fireEvent.click(screen.getAllByRole("button", { name: /^Ins Lager aufnehmen$/i })[0]);

    expect(addWineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseLocation: "Weinhandlung Kreis",
      }),
    );
  });

  it("blocks unknown purchase sources and offers inline merchant creation", () => {
    merchantsMock = [{
      id: "merchant-1",
      name: "Weinhandlung Kreis",
      deals: [],
      createdAt: "2026-05-08T00:00:00.000Z",
    }];

    render(<AddWine />);

    fireEvent.change(screen.getByPlaceholderText("z.B. Barolo Riserva"), {
      target: { value: "Barolo Riserva" },
    });
    fireEvent.change(screen.getByPlaceholderText("z.B. Conterno"), {
      target: { value: "Conterno" },
    });
    selectCountryAndRegion("Italien", "Piemont");

    const merchantInput = screen.getByLabelText("Bezugsquelle");
    fireEvent.change(merchantInput, { target: { value: "Neue Vinothek" } });

    fireEvent.click(screen.getByRole("button", { name: /Neue Vinothek.*als Händler erfassen/i }));
    expect(addMerchantMock).toHaveBeenCalledWith({ name: "Neue Vinothek" });

    fireEvent.click(screen.getAllByRole("button", { name: /^Ins Lager aufnehmen$/i })[0]);

    expect(addWineMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Bitte wähle eine erfasste Bezugsquelle oder lege den Händler direkt an.",
        variant: "destructive",
      }),
    );
  });
});
