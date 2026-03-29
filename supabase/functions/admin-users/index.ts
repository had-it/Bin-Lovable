import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller identity
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user: caller },
    error: authError,
  } = await supabaseClient.auth.getUser();
  if (authError || !caller) return jsonResponse({ error: "Unauthorized" }, 401);

  // Check caller role
  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("role, hospital")
    .eq("id", caller.id)
    .single();

  if (
    !callerProfile ||
    !["BinSight Admin", "Hospital Admin"].includes(callerProfile.role)
  ) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const url = new URL(req.url);

  // GET — List users
  if (req.method === "GET") {
    const hospital = url.searchParams.get("hospital");
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, name, role, department, hospital, hospital_name");

    if (hospital && hospital !== "all") {
      query = query.eq("hospital", hospital);
    }
    if (callerProfile.role === "Hospital Admin") {
      query = query.eq("hospital", callerProfile.hospital);
    }

    const { data, error } = await query.order("name");
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse(data);
  }

  // POST — Create user
  if (req.method === "POST") {
    const { email, password, name, role, department, hospital, hospital_name } =
      await req.json();

    if (!email || !password) {
      return jsonResponse({ error: "Email and password required" }, 400);
    }

    if (
      callerProfile.role === "Hospital Admin" &&
      hospital !== callerProfile.hospital
    ) {
      return jsonResponse(
        { error: "Cannot create users for other hospitals" },
        403,
      );
    }

    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return jsonResponse({ error: createError.message }, 400);
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email,
        name: name || null,
        role: role || "Department User",
        department: department || null,
        hospital: hospital || "",
        hospital_name: hospital_name || "",
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return jsonResponse({ error: profileError.message }, 500);
    }

    return jsonResponse({ success: true, user_id: newUser.user.id });
  }

  // PATCH — Update user profile
  if (req.method === "PATCH") {
    const { user_id, name, role, department } = await req.json();
    if (!user_id) return jsonResponse({ error: "user_id required" }, 400);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        name: name || null,
        role: role || "Department User",
        department: department || null,
      })
      .eq("id", user_id);

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ success: true });
  }

  // POST /bulk — Bulk import users
  if (req.method === "PUT") {
    const { users: userRows } = await req.json();
    let success = 0;
    let failed = 0;

    for (const row of userRows) {
      if (!row.email || !row.password) {
        failed++;
        continue;
      }

      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: row.email,
          password: row.password,
          email_confirm: true,
        });

      if (createError) {
        failed++;
        continue;
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: newUser.user.id,
          email: row.email,
          name: row.name || null,
          role: row.role || "Department User",
          department: row.department || null,
          hospital: row.hospital || "",
          hospital_name: row.hospital_name || "",
        });

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        failed++;
      } else {
        success++;
      }
    }

    return jsonResponse({ success, failed });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
