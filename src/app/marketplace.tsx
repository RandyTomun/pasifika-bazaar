"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AffiliateProduct } from "@/lib/catalog";
import s from "./page.module.css";

function shopperCategory(product: AffiliateProduct) {
  if (product.category && !["Other", "Uncategorised"].includes(product.category)) return product.category;
  const text = `${product.name} ${product.description}`.toLowerCase();
  if (/earpods|earphone|earbud|headphone|speaker/.test(text)) return "Audio";
  if (/airtag|tracker|luggage/.test(text)) return "Travel & Tracking";
  if (/microsd|memory card|kindle|reader/.test(text)) return "Storage & Reading";
  if (/remote|hdmi|television|projector/.test(text)) return "Home Entertainment";
  if (/power bank|charger|charging|usb-c|cable/.test(text)) return "Charging & Power";
  return "Other";
}

export default function Marketplace({ products }: { products: AffiliateProduct[] }) {
  const categorisedProducts = useMemo(() => products.map((p) => ({ ...p, category: shopperCategory(p), badge: p.badge?.startsWith("Amazon Bestseller #") ? "Bestseller pick" : p.badge })), [products]);
  const categories = useMemo(() => ["All", ...new Set(categorisedProducts.map((p) => p.category))], [categorisedProducts]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AffiliateProduct | null>(null);
  const shown = categorisedProducts.filter((p) => (category === "All" || p.category === category) && `${p.name} ${p.description} ${p.retailer}`.toLowerCase().includes(query.toLowerCase()));
  function recordClick(product: AffiliateProduct) { navigator.sendBeacon?.("/api/affiliate/click", new Blob([JSON.stringify({ productId: product.id })], { type: "application/json" })); }

  return <main>
    <div className={s.notice}>INDEPENDENT PRODUCT DISCOVERY <span>SHOP AMAZON AUSTRALIA</span></div>
    <header className={s.header}><a className={s.brand} href="#top"><b>≋</b><strong>Pasifika<span>Bazaar</span></strong></a><label className={s.search}><span>⌕</span><input aria-label="Search products" placeholder="Search products and deals…" value={query} onChange={(e) => setQuery(e.target.value)} /></label><nav><a href="#shop">Discover</a><Link href="/guides">Buying guides</Link><Link href="/affiliate-disclosure">How we earn</Link><Link className={s.signinLink} href="/admin/login">Admin</Link></nav></header>
    <div className={s.tabs}>{categories.map((c) => <button key={c} className={c === category ? s.activeTab : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <section className={s.hero} id="top"><div className={s.heroCopy}><small>● CURATED FOR PACIFIC SHOPPERS</small><h1>Great finds.<br /><em>One Pacific destination.</em></h1><p>Discover useful products from Amazon Australia. Explore our independently curated picks, then complete your purchase securely on Amazon.</p><div className={s.actions}><button onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>Explore products →</button><Link href="/affiliate-disclosure">How affiliate links work</Link></div><div className={s.trust}><span>✓ Retailer checkout</span><span>◇ Curated product links</span><span>★ No extra cost to you</span></div></div>
      <div className={s.heroVisual}><div className={s.largePhoto}><Image src="https://images.unsplash.com/photo-1580458148390-76414895c3cd?auto=format&fit=crop&w=1200&q=90" alt="Turquoise ocean waves meeting a Pacific beach" fill priority sizes="(max-width:800px) 100vw,50vw" /></div><div className={s.perk}><small>CURATED STORE</small><strong>AU</strong><p>popular Amazon products selected for Pacific shoppers</p><code>AMAZON AUSTRALIA</code></div></div></section>
    <section className={s.shop} id="shop"><div className={s.sectionHead}><div><small>CURATED MARKETPLACE</small><h2>{category === "All" ? "Popular product discoveries" : category}</h2></div><p>{shown.length} products</p></div>
      {shown.length ? <div className={s.grid}>{shown.map((p) => <article className={s.card} key={p.id}><button className={s.photo} onClick={() => setSelected(p)} aria-label={`View ${p.name}`}><Image src={p.image} alt={p.name} fill unoptimized sizes="(max-width:650px) 50vw,25vw" />{p.badge && <span>{p.badge}</span>}<i className={`${s.retailer} ${s[p.retailer.toLowerCase()]}`}>{p.retailer}</i></button><div className={s.cardBody}><small>{p.category}</small><button className={s.productName} onClick={() => setSelected(p)}>{p.name}</button>{p.rating !== null && <div className={s.rating}>★ {p.rating.toFixed(1)} <span>({p.reviews.toLocaleString()})</span></div>}<div className={s.buy}><span>{p.retailer === "Amazon" || p.price === 0 ? <strong>Check price on {p.retailer}</strong> : <><strong>A${p.price.toFixed(2)}</strong>{p.originalPrice && p.originalPrice > p.price && <del>A${p.originalPrice.toFixed(2)}</del>}</>}</span><a href={p.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" onClick={() => recordClick(p)}>View deal ↗</a></div></div></article>)}</div>
      : <div className={s.empty}><h3>Our first product picks are coming soon</h3><p>We are preparing more approved Amazon Australia product picks. Check back shortly.</p></div>}</section>
    <section className={s.editorial}><div><small>HOW IT WORKS</small><h2>Discover here. Buy securely on Amazon.</h2></div><ol><li><b>1</b><span><strong>Browse curated picks</strong>Find useful products selected for Pacific shoppers.</span></li><li><b>2</b><span><strong>Open the retailer</strong>Prices and availability are confirmed on Amazon Australia.</span></li><li><b>3</b><span><strong>Checkout securely</strong>Amazon or the relevant Amazon seller handles payment, shipping, returns and support.</span></li></ol></section>
    <footer className={s.footer}><div className={s.brand}><b>≋</b><strong>Pasifika<span>Bazaar</span></strong></div><p>Product discovery for Australia, New Zealand, PNG and the Pacific.</p><div><a href="#shop">Discover</a><Link href="/guides">Buying guides</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><small>© 2026 Pasifika Bazaar. Prices and availability may change on retailer websites.</small></footer>
    {selected && <div className={s.overlay} onClick={() => setSelected(null)}><section className={s.modal} role="dialog" aria-modal="true" aria-label={selected.name} onClick={(e) => e.stopPropagation()}><button className={s.close} onClick={() => setSelected(null)}>×</button><div className={s.modalPhoto}><Image src={selected.image} alt={selected.name} fill unoptimized sizes="50vw" /></div><div className={s.modalInfo}><small>{selected.retailer} · {selected.category}</small><h2>{selected.name}</h2>{selected.rating !== null && <div className={s.rating}>★ {selected.rating.toFixed(1)} <span>({selected.reviews.toLocaleString()} retailer reviews)</span></div>}<p>{selected.description}</p>{selected.retailer === "Amazon" || selected.price === 0 ? <strong>Check current price on {selected.retailer}</strong> : <strong>A${selected.price.toFixed(2)}</strong>}<a className={s.modalDeal} href={selected.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" onClick={() => recordClick(selected)}>View on {selected.retailer} ↗</a><small>Final price, availability, delivery and returns are confirmed by {selected.retailer}.</small></div></section></div>}
  </main>;
}
