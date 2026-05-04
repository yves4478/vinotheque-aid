import type { Wine, WineType } from "../types/wine";
import type { RecognizedWineDraft } from "./labelParser";
import { inferWineDetailsFromText } from "./wineUrlParser";

export type RecognizedWineValues = Partial<Pick<
  Wine,
  "name" | "producer" | "vintage" | "region" | "country" | "type" | "grape"
>>;

const RED_GRAPES = [
  "nebbiolo",
  "sangiovese",
  "barbera",
  "cabernet sauvignon",
  "cabernet franc",
  "merlot",
  "pinot noir",
  "syrah",
  "shiraz",
  "grenache",
  "tempranillo",
  "garnacha",
  "malbec",
  "carménère",
  "pinotage",
  "tannat",
  "primitivo",
  "zinfandel",
  "corvina",
  "blaufränkisch",
  "zweigelt",
  "st. laurent",
  "spätburgunder",
  "dornfelder",
  "lemberger",
  "trollinger",
  "mourvèdre",
  "cinsault",
  "petit verdot",
];

const WHITE_GRAPES = [
  "chardonnay",
  "sauvignon blanc",
  "riesling",
  "pinot grigio",
  "pinot gris",
  "gewürztraminer",
  "grüner veltliner",
  "muscat",
  "viognier",
  "chenin blanc",
  "sémillon",
  "marsanne",
  "roussanne",
  "albariño",
  "verdejo",
  "godello",
  "grillo",
  "vermentino",
  "müller-thurgau",
  "silvaner",
  "weissburgunder",
  "chasselas",
  "petite arvine",
  "completer",
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
    .map((part) => part.trim().toLowerCase())
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
    // Always "medium" — country is inferred from text heuristics, never directly observed
    fields.country = { value: inferred.country, confidence: "medium" };
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
