import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { addPacificCollection, bulkImportAmazonProducts, createProduct, signOut, toggleProduct } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";
function money(cents: number, currency = "AUD") { return new Intl.NumberFormat("en-AU", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100); }

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function bulkMessage(params: Record<string, string | string[] | undefined>) {
  const status = typeof params.bulk === "string" ? params.bulk : "";
  if (status === "success") return { good: true, text: `Imported ${params.added ?? "0"} Amazon product(s) as drafts. ${params.skipped && params.skipped !== "0" ? `${params.skipped} duplicate(s) were skipped.` : ""}` };
  if (status === "duplicates") return { good: false, text: "Nothing was imported because every product is already in the catalogue." };
  if (status === "empty") return { good: false, text: "Paste at least one Amazon affiliate link." };
  if (status === "too-many") return { good: false, text: "Import up to 50 products at a time." };
  if (status === "error") return { good: false, text: typeof params.detail === "string" ? params.detail : "The import could not be completed." };
  return null;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await requireAdmin();
  const params = await searchParams;
  const importMessage = bulkMessage(params);
  const db = getSupabaseAdmin();
  const [{ data: products }, { data: orders }, { data: categories }, { count: affiliateClicks }] = await Promise.all([
    db.from("products").select("id,name,slug,price_aud_cents,retailer,is_active,created_at").order("created_at", { ascending: false }),
    db.from("orders").select("id,customer_email,status,total_cents,currency,created_at").order("created_at", { ascending: false }).limit(50),
    db.from("categories").select("id,name").eq("is_active", true).order("sort_order"),
    db.from("affiliate_clicks").select("id", { count: "exact", head: true }),
  ]);
  const paidTotal = (orders ?? []).filter((o) => o.status === "paid").reduce((sum, o) => sum + o.total_cents, 0);
  return <main className={styles.dashboard}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PASIFIKA BAZAAR</p><h1>Store dashboard</h1><p className={styles.muted}>Signed in as {user.email}</p></div><form action={signOut}><button className={styles.secondary}>Sign out</button></form></header>
    <section className={styles.stats}><article><span>Amazon products</span><strong>{products?.length ?? 0}</strong></article><article><span>Active listings</span><strong>{products?.filter((p) => p.is_active).length ?? 0}</strong></article><article><span>Retailer clicks</span><strong>{affiliateClicks ?? 0}</strong></article><article><span>Future direct sales</span><strong>{money(paidTotal)}</strong></article></section>

    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>FAST IMPORT</p><h2>Bulk import Amazon products</h2></div><span>Up to 50 at once</span></div>
      <div className={styles.collectionCallout}>
        <div><strong>Pacific lifestyle collection</strong><p className={styles.muted}>Add 10 popular beach, travel, swimming, outdoor and island-home products in one step.</p></div>
        <form action={addPacificCollection}><button type="submit">Add the 10-product collection</button></form>
      </div>
      <p className={styles.muted}>Or paste one full Amazon Australia affiliate link per line. You may optionally put a cleaner product name before the link, separated by a | symbol.</p>
      {importMessage && <p className={importMessage.good ? styles.successMessage : styles.errorMessage}>{importMessage.text}</p>}
      <form action={bulkImportAmazonProducts} className={styles.bulkForm}>
        <label>Amazon affiliate links
          <textarea name="amazon_links" rows={8} placeholder={"https://www.amazon.com.au/Product-Name/dp/B012345678?tag=pasifikabazaa-22\n\nOptional name | https://www.amazon.com.au/dp/B012345678?tag=pasifikabazaa-22"} required />
        </label>
        <p className={styles.muted}>Products are imported as drafts with a temporary illustration. Review their names, categories and images before publishing.</p>
        <button type="submit">Import products as drafts</button>
      </form>
    </section>

    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>AFFILIATE CATALOGUE</p><h2>Add one Amazon product</h2></div></div><form action={createProduct} className={styles.productForm}>
      <label>Product name<input name="name" required /></label><label>URL slug<input name="slug" placeholder="wireless-headphones" required /></label><input name="retailer" type="hidden" value="Amazon" /><label>Retailer<input value="Amazon Australia" disabled /></label><label>Category<select name="category_id"><option value="">Uncategorised</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Current price (use 0 for Amazon)<input name="price_aud" type="number" min="0" step="0.01" defaultValue="0" required /></label><label>Original price (optional)<input name="original_price_aud" type="number" min="0" step="0.01" /></label><label>Rating (optional)<input name="rating" type="number" min="0" max="5" step="0.1" /></label><label>Review count<input name="review_count" type="number" min="0" step="1" defaultValue="0" required /></label>
      <label className={styles.wide}>Approved affiliate link<input name="affiliate_url" type="url" placeholder="https://..." required /></label><label>Badge (optional)<input name="badge" placeholder="Popular pick" /></label><label>Upload image<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp" /></label><label className={styles.wide}>Or image URL<input name="image_url" type="url" placeholder="https://..." /></label><label className={styles.wide}>Description<textarea name="description" rows={3} /></label>
      <label className={styles.check}><input name="is_active" type="checkbox" /> Publish now</label><label className={styles.check}><input name="is_featured" type="checkbox" /> Featured product</label><button type="submit">Add product</button>
    </form></section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>CATALOGUE</p><h2>Amazon products</h2></div><span>{products?.length ?? 0} total</span></div><div className={styles.tableWrap}><table><thead><tr><th>Product</th><th>Retailer</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {products?.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small>/{p.slug}</small></td><td>{p.retailer ?? "—"}</td><td>{p.retailer === "Amazon" || p.price_aud_cents === 0 ? "Check on retailer" : money(p.price_aud_cents)}</td><td><span className={p.is_active ? styles.live : styles.draft}>{p.is_active ? "Live" : "Draft"}</span></td><td><form action={toggleProduct}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.is_active)} /><button className={styles.textButton}>{p.is_active ? "Unpublish" : "Publish"}</button></form></td></tr>)}
      {!products?.length && <tr><td colSpan={5} className={styles.empty}>No database products yet. Add your first one above.</td></tr>}
    </tbody></table></div></section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>STRIPE</p><h2>Recent orders</h2></div><span>Latest 50</span></div><div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>
      {orders?.map((o) => <tr key={o.id}><td>{new Date(o.created_at).toLocaleDateString("en-AU", { dateStyle: "medium" })}</td><td>{o.customer_email ?? "Guest"}</td><td><span className={styles.live}>{o.status}</span></td><td>{money(o.total_cents, o.currency)}</td></tr>)}
      {!orders?.length && <tr><td colSpan={4} className={styles.empty}>Completed Stripe orders will appear here automatically.</td></tr>}
    </tbody></table></div></section>
  </main>;
}
