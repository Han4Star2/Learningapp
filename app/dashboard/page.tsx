import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", user!.id)
    .single();

  const displayName = profile?.full_name || user?.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {displayName}.
        </p>
      </div>

      <Card>
        <h2 className="mb-2 font-medium">Your account</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500">Email:</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500">Name:</dt>
            <dd>{profile?.full_name ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500">Member since:</dt>
            <dd>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Coming soon</h2>
        <p className="text-sm text-gray-500">
          School years, subjects, study materials and AI practice tools will
          live here in future phases.
        </p>
      </Card>
    </div>
  );
}
