import type { Wine, WineType } from "../types/wine";
import type { RecognizedWineDraft } from "./labelParser";
import { inferWineDetailsFromText } from "./wineUrlParser";

export type RecognizedWineValues = Partial<Pick<
  Wine,
  "name" | "producer" | "vintage" | "region" | "country" | "type" | "grape"
>>;

const RED_GRAPES = [
  "Nebbiolo",
  "Sangiovese",
  "Barbera",
  "Cabernet Sauvignon",
  "Cabernet Franc",
  "Merlot",
  "Pinot Noir",
  "Syrah",
  "Shiraz",
  "Grenache",
  "Tempranillo",
  "Garnacha",
  "Malbec",
  "Carménère",
  "Pinotage",
  "Tannat",
  "Primitivo",
  "Zinfandel",
  "Corvina",
  "Blaufränkisch",
  "Zweigelt",
  "St. Laurent",
  "Spätburgunder",
  "Dornfelder",
  "Lemberger",
  "Trollinger",
  "Mourvèdre",
  "Cinsault",
  "Petit Verdot",
];

const WHITE_GRAPES = [
  "Chardonnay",
  "Sauvignon Blanc",
  "Riesling",
  "Pinot Grigio",
  "Pinot Gris",
  "Gewürztraminer",
  "Grüner Veltliner",
  "Muscat",
  "Viognier",
  "Chenin Blanc",
  "Sémillon",
  "Marsanne",
  "Roussanne",
  "Albariño",
  "Verdejo",
  "Godello",
  "Grillo",
  "Vermentino",
  "Müller-Thurgau",
  "Silvaner",
  "Weissburgunder",
  "Chasselas",
  "Petite Arvine",
  "Completer",
];

function buildInferenceText(draft: RecognizedWineDraft): string {
  return [
    draft.rawText,
    draft.fields.producer?.value,
    draft.fields.name?.value,
    draft.fields.region?.value,
    draft.fields.country?.value,
    draft.fields.grape?.value,
  ].filter(Boolean).join("\n");
}

function inferTypeFromGrape(grape?: string): WineType | undefined {
  if (!grape) return undefined;
  const candidates = grape
    .split(/[,+/&]| und /i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (candidates.some((candidate) => RED_GRAPES.includes(candidate))) {
    return "rot";
  }
  if (candidates.some((candidate) => WHITE_GRAPES.includes(candidate))) {
    return "weiss";
  }
  return undefined;
}

export function enrichRecognizedWineDraft(draft: RecognizedWineDraft): RecognizedWineDraft {
  const inferred = inferWineDetailsFromText(buildInferenceText(draft));
  const fields: RecognizedWineDraft["fields"] = { ...draft.fields };

  if (!fields.vintage && typeof inferred.vintage === "number") {
    fields.vintage = { value: inferred.vintage, confidence: "medium" };
  }

  if (!fields.region && inferred.region) {
    fields.region = { value: inferred.region, confidence: "medium" };
  }

  if (!fields.country && inferred.country) {
    fields.country = {
      value: inferred.country,
      confidence: fields.region?.value ? "high" : "medium",
    };
  }

  if (!fields.grape && inferred.grape) {
    fields.grape = { value: inferred.grape, confidence: "medium" };
  }

  if (!fields.type) {
    const inferredType = inferred.type ?? inferTypeFromGrape(fields.grape?.value ?? inferred.grape);
    if (inferredType) {
      fields.type = {
        value: inferredType,
        confidence: inferred.type ? "medium" : "low",
      };
    }
  }

  return {
    ...draft,
    fields,
  };
}

export function draftToWineValues(draft: RecognizedWineDraft): RecognizedWineValues {
  return {
    name: draft.fields.name?.value,
    producer: draft.fields.producer?.value,
    vintage: draft.fields.vintage?.value,
    region: draft.fields.region?.value,
    country: draft.fields.country?.value,
    type: draft.fields.type?.value,
    grape: draft.fields.grape?.value,
  };
}
