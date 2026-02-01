import { describe, expect, it, vi } from "vitest";

import { GET } from "./index";
import { getRecipes } from "../../../lib/services/recipes.service";

vi.mock("../../../lib/services/recipes.service", () => ({
  getRecipes: vi.fn(),
  createRecipe: vi.fn(),
}));

const getRecipesMock = vi.mocked(getRecipes);

function buildLocals() {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    },
  };
}

describe("GET /api/recipes", () => {
  it("parses query params and forwards typed query", async () => {
    const locals = buildLocals();
    getRecipesMock.mockResolvedValue({
      data: [],
      next_cursor: null,
    });

    const request = new Request("http://localhost/api/recipes?limit=5&cursor=2026-02-01T12:00:00.000Z&liked=true");
    const response = await GET({ locals, request } as never);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ data: [], next_cursor: null });
    expect(getRecipesMock).toHaveBeenCalledWith(locals.supabase, "user-1", {
      limit: 5,
      cursor: "2026-02-01T12:00:00.000Z",
      liked: true,
    });
  });

  it("uses default limit when missing", async () => {
    const locals = buildLocals();
    getRecipesMock.mockResolvedValue({
      data: [],
      next_cursor: null,
    });

    const request = new Request("http://localhost/api/recipes");
    const response = await GET({ locals, request } as never);

    expect(response.status).toBe(200);
    expect(getRecipesMock).toHaveBeenCalledWith(locals.supabase, "user-1", {
      limit: 20,
    });
  });

  it("returns BAD_REQUEST when limit is below minimum", async () => {
    const locals = buildLocals();
    const request = new Request("http://localhost/api/recipes?limit=0");

    const response = await GET({ locals, request } as never);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("BAD_REQUEST");
    expect(payload.error.message).toContain("Limit must be at least 1");
    expect(getRecipesMock).not.toHaveBeenCalled();
  });
});
