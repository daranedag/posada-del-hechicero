import "server-only";
import { queryDatabase } from "../db/server";
import { isAdminEmailAllowed } from "./admin-emails";

type Identity = { id: string; email: string; emailVerified: boolean; name?: string | null };

export async function authorizeIdentity(user: Identity, allowedEmails: string | undefined) {
  if (!user.emailVerified || !isAdminEmailAllowed(user.email, allowedEmails)) {
    // Revoke only an identity already linked to this authenticated Neon account.
    await queryDatabase("admin", `DELETE FROM public.pdh_admins a USING public.pdh_users u
      WHERE a.user_id=u.id AND u.neon_auth_user_id=$1`, [user.id]);
    return null;
  }
  const email = user.email.trim().toLowerCase();
  const name = user.name?.trim() || email.split("@")[0];
  // Keep historical tournament UUIDs; never rebind an already linked identity.
  const { rows } = await queryDatabase("admin", `
    WITH identity AS (
      INSERT INTO public.pdh_users (email,email_verified,profile,neon_auth_user_id)
      VALUES ($1,true,$2::jsonb,$3)
      ON CONFLICT (lower(email)) DO UPDATE SET
        neon_auth_user_id=EXCLUDED.neon_auth_user_id, email_verified=true,
        profile=public.pdh_users.profile || EXCLUDED.profile, updated_at=now()
      WHERE public.pdh_users.neon_auth_user_id IS NULL OR public.pdh_users.neon_auth_user_id=EXCLUDED.neon_auth_user_id
      RETURNING id
    )
    INSERT INTO public.pdh_admins (user_id,display_name)
    SELECT id,$4 FROM identity
    ON CONFLICT (user_id) DO UPDATE SET display_name=EXCLUDED.display_name
    RETURNING user_id,display_name`, [email, JSON.stringify({ name }), user.id, name]);
  if (!rows[0]) return null;
  return { ...user, id: String(rows[0].user_id), profile: { name }, admin: rows[0] };
}
