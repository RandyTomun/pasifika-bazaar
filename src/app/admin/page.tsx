import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createProduct, signOut, toggleProduct } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";
function money(cents: number, currency = "AUD") { return new Intl.NumberFormat("en-AU", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100); }

export default async function AdminPage() {
  const user = await requireAdmin();
  const db = getSupabaseAdmin();
  const [{ data: products }, { data: orders }, { data: categories }] = await Promise.all([
    db.from("products").select("id,name,slug,price_aud_cents,stock_quantity,is_active,created_at").order("created_at", { ascending: false }),
    db.from("orders").select("id,customer_email,status,total_cents,currency,created_at").order("created_at", { ascending: false }).limit(50),
    db.from("categories").select("id,name").eq("is_active", true).order("sort_order"),
  ]);
  const paidTotal = (orders ?? []).filter((o) => o.status === "paid").reduce((sum, o) => sum + o.total_cents, 0);
  return <main className={styles.dashboard}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PASIFIKA BAZAAR</p><h1>Store dashboard</h1><p className={styles.muted}>Signed in as {user.email}</p></div><form action={signOut}><button className={styles.secondary}>Sign out</button></form></header>
    <section className={styles.stats}><article><span>Products</span><strong>{products?.length ?? 0}</strong></article><article><span>Active listings</span><strong>{products?.filter((p) => p.is_active).length ?? 0}</strong></article><article><span>Paid orders</span><strong>{orders?.filter((o) => o.status === "paid").length ?? 0}</strong></article><article><span>Recorded sales</span><strong>{money(paidTotal)}</strong></article></section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>CATALOGUE</p><h2>Add a product</h2></div></div><form action={createProduct} className={styles.productForm}>
      <label>Product name<input name="name" required /></label><label>URL slug<input name="slug" placeholder="woven-market-bag" required /></label><label>Price (AUD)<input name="price_aud" type="number" min="0" step="0.01" required /></label><label>Stock<input name="stock_quantity" type="number" min="0" step="1" required /></label>
      <label>Category<select name="category_id"><option value="">Uncategorised</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className={styles.wide}>Image URL<input name="image_url" type="url" placeholder="https://..." /></label><label className={styles.wide}>Description<textarea name="description" rows={3} /></label>
      <label className={styles.check}><input name="is_active" type="checkbox" /> Publish now</label><label className={styles.check}><input name="is_featured" type="checkbox" /> Featured product</label><button type="submit">Add product</button>
    </form></section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>INVENTORY</p><h2>Products</h2></div><span>{products?.length ?? 0} total</span></div><div className={styles.tableWrap}><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {products?.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small>/{p.slug}</small></td><td>{money(p.price_aud_cents)}</td><td>{p.stock_quantity}</td><td><span className={p.is_active ? styles.live : styles.draft}>{p.is_active ? "Live" : "Draft"}</span></td><td><form action={toggleProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.is_active)} /><button className={styles.textButton}>{p.is_active ? "Unpublish" : "Publish"}</button></form></td></tr>)}
      {!products?.length && <tr><td colSpan={5} className={styles.empty}>No database products yet. Add your first one above.</td></tr>}
    </tbody></table></div></section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>STRIPE</p><h2>Recent orders</h2></div><span>Latest 50</span></div><div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>
      {orders?.map((o) => <tr key={o.id}><td>{new Date(o.created_at).toLocaleDateString("en-AU", { dateStyle: "medium" })}</td><td>{o.customer_email ?? "Guest"}</td><td><span className={styles.live}>{o.status}</span></td><td>{money(o.total_cents, o.currency)}</td></tr>)}
      {!orders?.length && <tr><td colSpan={4} className={styles.empty}>Completed Stripe orders will appear here automatically.</td></tr>}
    </tbody></table></div></section>
  </main>;
}
