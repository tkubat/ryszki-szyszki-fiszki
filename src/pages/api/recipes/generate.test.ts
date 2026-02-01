import { describe, expect, it, vi } from "vitest";

import { POST } from "./generate";
import { generateRecipe } from "../../../lib/services/recipes.generate";

vi.mock("../../../lib/services/recipes.generate", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/services/recipes.generate")>(
    "../../../lib/services/recipes.generate",
  );

  return {
    ...actual,
    generateRecipe: vi.fn(),
  };
});

const generateRecipeMock = vi.mocked(generateRecipe);

function buildLocals() {
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: "recipe-1",
          title: "Soup",
          ingredients: "water",
          steps: "Boil",
          liked: false,
          created_at: "2026-02-01T12:00:00.000Z",
        },
        error: null,
      }),
    }),
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        insert: insertMock,
      }),
    },
  };
}

describe("POST /api/recipes/generate", () => {
  it("returns validation error when ingredients count is too low", async () => {
    const locals = buildLocals();
    const request = new Request("http://localhost/api/recipes/generate", {
      method: "POST",
      body: JSON.stringify({
        ingredients: "tomato, onion",
        include_basics: false,
      }),
    });

    const response = await POST({ request, locals } as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("BAD_REQUEST");
    expect(payload.error.message).toContain("Provide at least 3 ingredients");
    expect(generateRecipeMock).not.toHaveBeenCalled();
  });

  it("creates recipe when payload is valid", async () => {
    const locals = buildLocals();
    generateRecipeMock.mockResolvedValue({
      recipe: {
        title: "Soup",
        ingredients: "water",
        steps: "Boil",
      },
      generation_time_ms: 1200,
    });

    const request = new Request("http://localhost/api/recipes/generate", {
      method: "POST",
      body: JSON.stringify({
        ingredients: "tomato, onion, garlic",
        include_basics: true,
      }),
    });

    const response = await POST({ request, locals } as never);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(generateRecipeMock).toHaveBeenCalledWith({
      ingredients: "tomato, onion, garlic",
      include_basics: true,
    });
    expect(payload.recipe).toMatchObject({
      id: "recipe-1",
      title: "Soup",
      ingredients: "water",
      steps: "Boil",
      liked: false,
    });
    expect(payload.generation_time_ms).toBe(1200);
  });
});
