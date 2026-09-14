import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signIn } from "../actions";
import styles from "../admin.module.css";

const messages: Record<string, string> = { "invalid-login": "The email or password was not recognised.", "not-authorized": "That account is not approved as an administrator." };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { data: admin } = await getSupabaseAdmin().from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (admin) redirect("/admin");
  }
  return <main className={styles.loginPage}><section className={styles.loginCard}>
    <Link href="/" className={styles.brand}>Pasifika<span>Bazaar</span></Link><p className={styles.eyebrow}>STORE MANAGEMENT</p>
    <h1>Administrator sign in</h1><p className={styles.muted}>Manage products and review Stripe-paid orders.</p>
    {params.error && <p className={styles.error}>{messages[params.error] ?? "Unable to sign in."}</p>}
    <form action={signIn} className={styles.form}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button type="submit">Sign in securely</button></form>
    <Link href="/" className={styles.backLink}>← Return to the bazaar</Link>
  </section></main>;
}
