import type { GenerateRecipeCommand } from "../../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-3.5-turbo";
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_BASICS = ["salt", "black pepper", "neutral oil", "water"];
const INGREDIENTS_SPLIT_REGEX = /[,;\n]+/;

export interface GeneratedRecipe {
  title: string;
  ingredients: string;
  steps: string;
}

export interface GenerateRecipeResult {
  recipe: GeneratedRecipe;
  generation_time_ms: number;
}

export type RecipeGenerationErrorCode = "TIMEOUT" | "AI_PROVIDER_ERROR" | "INVALID_RESPONSE" | "CONFIG_ERROR";

export class RecipeGenerationError extends Error {
  readonly code: RecipeGenerationErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: RecipeGenerationErrorCode, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Generates a recipe using OpenRouter based on provided ingredients.
 *
 * Returns normalized recipe content along with total generation time.
 */
export async function generateRecipe(command: GenerateRecipeCommand): Promise<GenerateRecipeResult> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new RecipeGenerationError("CONFIG_ERROR", "Missing OpenRouter API key", 500);
  }

  const model = import.meta.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
  const startTime = Date.now();
  const ingredientsForPrompt = buildPromptIngredients(command.ingredients, command.include_basics);
  const { systemPrompt, userPrompt } = buildPrompts(ingredientsForPrompt);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new RecipeGenerationError("AI_PROVIDER_ERROR", "AI provider error", 502, {
        status: response.status,
        payload,
      });
    }

    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new RecipeGenerationError("INVALID_RESPONSE", "AI response missing content", 502, { payload });
    }

    const recipe = parseRecipeFromContent(content);

    return {
      recipe,
      generation_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof RecipeGenerationError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new RecipeGenerationError("TIMEOUT", "AI request timed out", 408);
    }

    throw new RecipeGenerationError("AI_PROVIDER_ERROR", "Unexpected AI provider error", 502, {
      error_message: error instanceof Error ? error.message : "unknown",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPromptIngredients(ingredients: string, includeBasics: boolean): string {
  const normalizedItems = splitIngredients(ingredients);
  const combinedItems = includeBasics ? [...normalizedItems, ...DEFAULT_BASICS] : normalizedItems;

  return combinedItems.join(", ");
}

function splitIngredients(ingredients: string): string[] {
  return ingredients
    .split(INGREDIENTS_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPrompts(ingredients: string): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    "You are a helpful cooking assistant.",
    "Return ONLY valid JSON with keys: title, ingredients, steps.",
    "Do not include markdown or code fences.",
  ].join(" ");

  const userPrompt = [
    "Create a concise, practical recipe based on the following ingredients list.",
    "Return the ingredients as a comma-separated string, and steps as a multi-line string.",
    `Ingredients: ${ingredients}`,
  ].join(" ");

  return { systemPrompt, userPrompt };
}

function parseRecipeFromContent(content: string): GeneratedRecipe {
  const jsonContent = extractJson(content);
  const raw = JSON.parse(jsonContent);

  const title = typeof raw?.title === "string" ? raw.title.trim() : "";
  const ingredients = typeof raw?.ingredients === "string" ? raw.ingredients.trim() : "";
  const steps = typeof raw?.steps === "string" ? raw.steps.trim() : "";

  if (!title || !ingredients || !steps) {
    throw new RecipeGenerationError("INVALID_RESPONSE", "AI response missing recipe fields", 502, { raw });
  }

  return { title, ingredients, steps };
}

function extractJson(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const startIndex = trimmed.indexOf("{");
  const endIndex = trimmed.lastIndexOf("}");

  if (startIndex === -1 || endIndex <= startIndex) {
    throw new RecipeGenerationError("INVALID_RESPONSE", "AI response is not valid JSON", 502, { content });
  }

  return trimmed.slice(startIndex, endIndex + 1);
}
