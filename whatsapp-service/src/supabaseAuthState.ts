import { createClient } from "@supabase/supabase-js";
import {
  initAuthCreds,
  BufferJSON,
  proto,
  type AuthenticationState,
  type SignalDataTypeMap,
} from "@whiskeysockets/baileys";

/**
 * Baileys auth state persisted in Supabase, so the paired-device credentials
 * survive service restarts / redeploys (Render's free filesystem is ephemeral).
 *
 * Table: wa_auth_state (session_id text, key text, value text, primary key(session_id,key))
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const TABLE = "wa_auth_state";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("[auth] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — WhatsApp login will NOT persist.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function readData(sessionId: string, key: string): Promise<unknown | null> {
  const { data } = await supabase.from(TABLE).select("value").eq("session_id", sessionId).eq("key", key).maybeSingle();
  if (!data?.value) return null;
  return JSON.parse(data.value as string, BufferJSON.reviver);
}

async function writeData(sessionId: string, key: string, value: unknown): Promise<void> {
  const str = JSON.stringify(value, BufferJSON.replacer);
  await supabase
    .from(TABLE)
    .upsert({ session_id: sessionId, key, value: str, updated_at: new Date().toISOString() }, { onConflict: "session_id,key" });
}

async function removeData(sessionId: string, key: string): Promise<void> {
  await supabase.from(TABLE).delete().eq("session_id", sessionId).eq("key", key);
}

/** Delete all persisted auth for a session (logout / delete / fresh pairing). */
export async function clearAuthState(sessionId: string): Promise<void> {
  await supabase.from(TABLE).delete().eq("session_id", sessionId);
}

/** Session ids that have persisted credentials (used to auto-restore on startup). */
export async function listAuthSessions(): Promise<string[]> {
  const { data } = await supabase.from(TABLE).select("session_id").eq("key", "creds");
  return (data ?? []).map((r) => r.session_id as string);
}

export async function useSupabaseAuthState(
  sessionId: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const creds = ((await readData(sessionId, "creds")) as AuthenticationState["creds"]) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
          const result: { [id: string]: SignalDataTypeMap[T] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(sessionId, `${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value as object);
              }
              result[id] = value as SignalDataTypeMap[T];
            })
          );
          return result;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const type in data) {
            const entries = (data as Record<string, Record<string, unknown>>)[type];
            for (const id in entries) {
              const value = entries[id];
              const key = `${type}-${id}`;
              tasks.push(value ? writeData(sessionId, key, value) : removeData(sessionId, key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(sessionId, "creds", creds);
    },
  };
}
