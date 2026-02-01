import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Playwright teardown.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const deleteRecipes = async (supabase: ReturnType<typeof createAdminClient>) => {
  const { error } = await supabase.from("recipes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`Failed to delete recipes: ${error.message}`);
  }
};

const deleteAllUsers = async (supabase: ReturnType<typeof createAdminClient>) => {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const users = data?.users ?? [];
    if (users.length === 0) {
      break;
    }

    const deleteResults = await Promise.all(users.map((user) => supabase.auth.admin.deleteUser(user.id)));

    const deleteError = deleteResults.find((result) => result.error)?.error;
    if (deleteError) {
      throw new Error(`Failed to delete users: ${deleteError.message}`);
    }

    if (!data?.nextPage) {
      break;
    }

    page = data.nextPage;
  }
};

const globalTeardown = async () => {
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Playwright teardown skipped: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return;
  }

  const supabase = createAdminClient();

  await deleteRecipes(supabase);
  await deleteAllUsers(supabase);
};

export default globalTeardown;
