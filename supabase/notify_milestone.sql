-- ================================================================
-- Notificación de hito: usuario llega a 10,000 monedas (≥ $1 USD)
-- Ejecutar en Supabase SQL Editor
--
-- Crea una función que llama al endpoint /admin/notify/user (POST)
-- cuando un usuario cruza el umbral de 10,000 monedas.
-- ================================================================

-- Habilitar la extensión http si no está activa
create extension if not exists http with schema extensions;

-- Función que se dispara al actualizar coins en users
create or replace function notify_cashout_milestone()
returns trigger
language plpgsql
security definer
as $$
declare
  threshold   int := 10000;
  fcm_token   text;
  api_url     text := 'https://juegalo-api.vercel.app/admin/notify/user';
begin
  -- Solo si el usuario ACABA de cruzar el umbral (venía de < 10k y ahora ≥ 10k)
  if OLD.coins < threshold and NEW.coins >= threshold then

    -- Llamar al endpoint que enviará la notificación al token del usuario
    perform extensions.http_post(
      api_url,
      json_build_object(
        'user_id', NEW.id,
        'title',   '🏆 ¡Ya puedes cobrar!',
        'body',    concat('Tienes ', NEW.coins::text, ' monedas — suficiente para retirar tu primer dólar. ¡Cobra ahora!'),
        'data',    json_build_object('type', 'milestone_cashout', 'screen', 'wallet')
      )::text,
      'application/json'
    );

  end if;
  return NEW;
end;
$$;

-- Trigger sobre la tabla users
drop trigger if exists trg_notify_cashout_milestone on users;
create trigger trg_notify_cashout_milestone
  after update of coins on users
  for each row
  execute function notify_cashout_milestone();
