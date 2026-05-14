import { supabaseAdmin } from "@/utils/supabase/admin";
import ContentForm from "@/components/ContentForm";
import type { SiteConfig } from "@/types";

export default async function ContentPage() {
  const { data: config } = await supabaseAdmin
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Edit Invitation Content</h1>
      <ContentForm config={config as SiteConfig} />
    </div>
  );
}
