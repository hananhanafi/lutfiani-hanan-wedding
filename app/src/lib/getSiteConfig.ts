import { createClient } from "@/utils/supabase/server";
import type { SiteConfig } from "@/types";

export async function getSiteConfig(): Promise<SiteConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Failed to fetch site config:", error.message);
    return null;
  }

  return data as SiteConfig;
}
