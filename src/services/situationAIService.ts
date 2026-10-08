import type { IncidentKnowledgeItem } from "../types";

export type SafetySuggestionType =
  | "fake_call"
  | "share_location"
  | "safe_haven"
  | "protection_mode"
  | "trusted_contact";

type SituationAIResponse = {
  matchedIncident: IncidentKnowledgeItem | null;
  lines: string[];
  suggestions: SafetySuggestionType[];
};

const rawKnowledgeBase = require("../data/incidentKnowledgeBase.json") as IncidentKnowledgeItem[];

const incidentKnowledgeBase: IncidentKnowledgeItem[] = Array.isArray(rawKnowledgeBase)
  ? rawKnowledgeBase
  : [];

const riskWeight: Record<IncidentKnowledgeItem["risk_level"], number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const fallbackLines = [
  "I'm not fully sure about that situation, but here are some actions that can help keep you safe.",
  "• Use Fake Call to exit an uncomfortable situation",
  "• Share your live location with someone you trust",
  "• Move toward a public place",
  "• Find the nearest Safe Haven",
  "• Activate Protection Mode if immediate risk appears"
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueSuggestions = (items: SafetySuggestionType[]) => {
  const seen = new Set<SafetySuggestionType>();
  const output: SafetySuggestionType[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      output.push(item);
    }
  }
  return output;
};

const suggestionsFromActions = (
  actions: string[],
  userText: string
): SafetySuggestionType[] => {
  const base: SafetySuggestionType[] = [];
  const allText = `${actions.join(" ")} ${userText}`.toLowerCase();

  for (const action of actions) {
    const normalized = action.toLowerCase();

    if (normalized.includes("fake call")) {
      base.push("fake_call");
    }
    if (
      normalized.includes("share location") ||
      normalized.includes("live location") ||
      normalized.includes("trusted contact")
    ) {
      base.push("share_location");
    }
    if (normalized.includes("safe haven") || normalized.includes("public place")) {
      base.push("safe_haven");
    }
    if (
      normalized.includes("protection mode") ||
      normalized.includes("emergency services")
    ) {
      base.push("protection_mode");
    }
    if (normalized.includes("call trusted contact")) {
      base.push("trusted_contact");
    }
  }

  if (allText.includes("call")) {
    base.push("fake_call");
    base.push("trusted_contact");
  }
  if (allText.includes("location")) {
    base.push("share_location");
  }
  if (allText.includes("safe")) {
    base.push("safe_haven");
  }
  if (allText.includes("emergency") || allText.includes("danger")) {
    base.push("protection_mode");
  }

  const deduped = uniqueSuggestions(base);
  if (deduped.length === 0) {
    return ["fake_call", "share_location", "safe_haven"];
  }
  return deduped.slice(0, 4);
};

const scoreIncidentMatch = (normalizedInput: string, incident: IncidentKnowledgeItem) => {
  const inputTokens = new Set(normalizedInput.split(" ").filter(Boolean));
  let score = 0;
  let directMatches = 0;

  for (const keyword of incident.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedInput.includes(normalizedKeyword)) {
      directMatches += 1;
      score += normalizedKeyword.includes(" ") ? 6 : 4;
      continue;
    }

    const parts = normalizedKeyword.split(" ").filter(Boolean);
    const partialMatches = parts.filter((part) => inputTokens.has(part)).length;
    if (partialMatches > 0) {
      score += partialMatches;
    }
  }

  score += riskWeight[incident.risk_level];
  return { score, directMatches };
};

const matchIncident = (input: string): IncidentKnowledgeItem | null => {
  const normalizedInput = normalize(input);
  if (!normalizedInput) {
    return null;
  }

  let best: {
    incident: IncidentKnowledgeItem;
    score: number;
    directMatches: number;
  } | null = null;

  for (const incident of incidentKnowledgeBase) {
    const result = scoreIncidentMatch(normalizedInput, incident);

    if (!best) {
      best = { incident, score: result.score, directMatches: result.directMatches };
      continue;
    }

    if (result.score > best.score) {
      best = { incident, score: result.score, directMatches: result.directMatches };
      continue;
    }

    if (
      result.score === best.score &&
      result.directMatches > best.directMatches
    ) {
      best = { incident, score: result.score, directMatches: result.directMatches };
    }
  }

  if (!best || best.score <= riskWeight.low + 1 || best.directMatches === 0) {
    return null;
  }

  return best.incident;
};

export const situationAIService = {
  totalScenarios: incidentKnowledgeBase.length,

  analyzeInput(userInput: string): SituationAIResponse {
    const match = matchIncident(userInput);

    if (!match) {
      return {
        matchedIncident: null,
        lines: fallbackLines,
        suggestions: ["fake_call", "share_location", "safe_haven"]
      };
    }

    return {
      matchedIncident: match,
      lines: [
        `Possible incident: ${match.incident_title}`,
        `Risk level: ${match.risk_level.toUpperCase()}`,
        "Suggested actions:",
        ...match.recommended_actions.map((action) => `• ${action}`)
      ],
      suggestions: suggestionsFromActions(match.recommended_actions, userInput)
    };
  }
};

