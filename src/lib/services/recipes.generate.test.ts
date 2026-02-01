import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateRecipe, RecipeGenerationError } from "./recipes.generate";

const BASE_COMMAND = {
  ingredients: "tomato, onion, garlic",
  include_basics: false,
};

function buildFetchOk(content: string) {
  return vi.fn(async (_url: RequestInfo, init?: RequestInit) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content } }],
      }),
      requestInit: init,
    } as unknown as Response;
  });
}

function buildFetchError(status: number, payload: unknown) {
  return vi.fn(async () => {
    return {
      ok: false,
      status,
      json: async () => payload,
    } as unknown as Response;
  });
}

function setApiKey(value?: string) {
  if (value === undefined) {
    delete process.env.OPENROUTER_API_KEY;
    return;
  }

  process.env.OPENROUTER_API_KEY = value;
}

describe("generateRecipe", () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    setApiKey("test-key");
  });

  afterEach(() => {
    setApiKey(originalApiKey);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("throws CONFIG_ERROR when API key is missing", async () => {
    setApiKey(undefined);

    await expect(generateRecipe(BASE_COMMAND)).rejects.toMatchObject({
      code: "CONFIG_ERROR",
      status: 500,
    });
  });

  it("includes basics in the prompt when requested", async () => {
    const fetchMock = buildFetchOk(
      JSON.stringify({
        title: "Test",
        ingredients: "tomato",
        steps: "Step 1",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateRecipe({
      ingredients: "tomato; onion",
      include_basics: true,
    });

    const [_url, init] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body ?? "{}"));
    const userPrompt = body?.messages?.[1]?.content ?? "";

    expect(userPrompt).toContain(
      "Ingredients: tomato, onion, salt, black pepper, neutral oil, water",
    );
  });

  it("extracts JSON when response includes extra text", async () => {
    const fetchMock = buildFetchOk(
      `Here is your recipe:\n{"title":"Soup","ingredients":"water","steps":"Boil"}\nEnjoy!`,
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateRecipe(BASE_COMMAND);

    expect(result.recipe).toEqual({
      title: "Soup",
      ingredients: "water",
      steps: "Boil",
    });
  });

  it("throws INVALID_RESPONSE when JSON is missing required fields", async () => {
    const fetchMock = buildFetchOk(
      JSON.stringify({
        title: "",
        ingredients: "salt",
        steps: "Mix",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateRecipe(BASE_COMMAND)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });

  it("throws INVALID_RESPONSE when content is not JSON", async () => {
    const fetchMock = buildFetchOk("No JSON here");
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateRecipe(BASE_COMMAND)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });

  it("throws AI_PROVIDER_ERROR when provider returns non-OK", async () => {
    const fetchMock = buildFetchError(500, { error: "boom" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateRecipe(BASE_COMMAND)).rejects.toMatchObject({
      code: "AI_PROVIDER_ERROR",
      status: 502,
    });
  });

  it("throws TIMEOUT when request is aborted", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_url: RequestInfo, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (!init?.signal) {
          return;
        }

        if (init.signal.aborted) {
          const abortedError = new Error("Aborted");
          (abortedError as Error & { name: string }).name = "AbortError";
          reject(abortedError);
          return;
        }

        init.signal.addEventListener("abort", () => {
          const abortedError = new Error("Aborted");
          (abortedError as Error & { name: string }).name = "AbortError";
          reject(abortedError);
        });
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const promise = generateRecipe(BASE_COMMAND);
    const expectation = expect(promise).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 408,
    });
    await vi.advanceTimersByTimeAsync(60_000);
    await expectation;
  });

  it("returns RecipeGenerationError on provider error payload", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: "rate-limited" }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateRecipe(BASE_COMMAND)).rejects.toBeInstanceOf(RecipeGenerationError);
  });
});
