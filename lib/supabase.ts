import { createClient } from '@supabase/supabase-js';

// Usa service_role key (acceso total, solo en backend)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Acreditar monedas a un usuario (via RPC — transacción ACID)
export async function creditCoins(
  userId: string,
  coins: number,
  source: string,
  description?: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.rpc('credit_coins', {
    p_user_id:    userId,
    p_coins:      coins,
    p_source:     source,
    p_description: description ?? null,
    p_metadata:   metadata ?? {},
  });
  if (error) throw new Error(`Error acreditando monedas: ${error.message}`);
}
