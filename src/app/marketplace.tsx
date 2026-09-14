"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import s from "./page.module.css";
type Category = "All" | "Kids & Family" | "Adults & Lifestyle" | "Business";
type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description: string;
};
const products: Product[] = [
  {
    id: 1,
    name: "Pacific Explorer Learning Set",
    category: "Kids & Family",
    price: 48.96,
    rating: 4.9,
    reviews: 214,
    image:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1000&q=85",
    badge: "Family favourite",
    description:
      "A colourful wooden learning set for shapes, numbers and early discovery.",
  },
  {
    id: 2,
    name: "Island Kids Cotton Tee",
    category: "Kids & Family",
    price: 37.49,
    rating: 4.8,
    reviews: 168,
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1000&q=85",
    description:
      "Soft, breathable cotton made for warm days and active little explorers.",
  },
  {
    id: 3,
    name: "Reef Guardian Backpack",
    category: "Kids & Family",
    price: 59.67,
    rating: 4.8,
    reviews: 96,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85",
    description:
      "A durable everyday backpack with practical storage for school and travel.",
  },
  {
    id: 4,
    name: "Aurora Wireless Headphones",
    category: "Adults & Lifestyle",
    price: 136,
    rating: 4.8,
    reviews: 431,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
    badge: "Trending",
    description:
      "Comfortable wireless listening with clear sound and all-day battery life.",
  },
  {
    id: 5,
    name: "Tidewatch Smartwatch",
    category: "Adults & Lifestyle",
    price: 197,
    rating: 4.7,
    reviews: 288,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
    description:
      "Track your day, workouts and notifications from a sleek everyday watch.",
  },
  {
    id: 6,
    name: "Island Artisan Ceramic Mug",
    category: "Adults & Lifestyle",
    price: 29.07,
    rating: 4.7,
    reviews: 203,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=85",
    description:
      "A handcrafted-style ceramic mug inspired by relaxed Pacific mornings.",
  },
  {
    id: 7,
    name: "Portable POS Terminal Kit",
    category: "Business",
    price: 304,
    rating: 5,
    reviews: 87,
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
    badge: "Bulk pricing",
    description:
      "A compact point-of-sale starter kit for mobile and growing businesses.",
  },
  {
    id: 8,
    name: "Eco Packaging Bundle",
    category: "Business",
    price: 136,
    rating: 4.9,
    reviews: 134,
    image:
      "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=1000&q=85",
    badge: "100 pack",
    description:
      "Recyclable packaging supplies for makers, merchants and online sellers.",
  },
];
const categories: Category[] = [
  "All",
  "Kids & Family",
  "Adults & Lifestyle",
  "Business",
];
export default function Marketplace() {
  const [category, setCategory] = useState<Category>("All"),
    [query, setQuery] = useState(""),
    [cart, setCart] = useState<number[]>([]),
    [selected, setSelected] = useState<Product | null>(null),
    [cartOpen, setCartOpen] = useState(false);
  const shown = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );
  const total = cart.reduce(
      (sum, id) => sum + (products.find((p) => p.id === id)?.price ?? 0),
      0,
    ),
    add = (id: number) => setCart((a) => [...a, id]);
  return (
    <main>
      <div className={s.notice}>
        FREE SHIPPING FOR NEW CUSTOMERS <span>USE CODE PACIFICFREE</span>
      </div>
      <header className={s.header}>
        <a className={s.brand} href="#top">
          <b>≋</b>
          <strong>
            Pasifika<span>Bazaar</span>
          </strong>
        </a>
        <label className={s.search}>
          <span>⌕</span>
          <input
            aria-label="Search products"
            placeholder="Search the marketplace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <nav>
          <a href="#sell">Sell with us</a>
          <button className={s.currency}>🇦🇺 AUD</button>
          <button className={s.signin}>Sign in</button>
          <button
            className={s.cartButton}
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            Bag <i>{cart.length}</i>
          </button>
        </nav>
      </header>
      <div className={s.tabs}>
        {categories.map((c) => (
          <button
            key={c}
            className={c === category ? s.activeTab : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <section className={s.hero} id="top">
        <div className={s.heroCopy}>
          <small>● NOW SHIPPING ACROSS THE PACIFIC</small>
          <h1>
            Made for the Pacific.
            <br />
            <em>Delivered to you.</em>
          </h1>
          <p>
            Discover products for families, everyday life and business—with
            familiar currencies and dependable regional delivery.
          </p>
          <div className={s.actions}>
            <button
              onClick={() =>
                document
                  .getElementById("shop")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop the bazaar →
            </button>
            <a href="#sell">Become a seller</a>
          </div>
          <div className={s.trust}>
            <span>✓ Secure Stripe checkout</span>
            <span>◇ Regional delivery</span>
            <span>★ Trusted marketplace</span>
          </div>
        </div>
        <div className={s.heroVisual}>
          <div className={s.largePhoto}>
            <Image
          src="https://images.unsplash.com/photo-1580458148390-76414895c3cd?auto=format&fit=crop&w=1200&q=90"
          alt="Turquoise ocean waves meeting a Pacific beach"
              fill
              priority
              sizes="(max-width:800px) 100vw,50vw"
            />
          </div>
          <div className={s.perk}>
            <small>NEW CUSTOMER PERK</small>
            <strong>FREE</strong>
            <p>shipping on your first order</p>
            <code>PACIFICFREE</code>
          </div>
        </div>
      </section>
      <section className={s.shop} id="shop">
        <div className={s.sectionHead}>
          <div>
            <small>CURATED FOR OUR REGION</small>
            <h2>
              {category === "All" ? "Popular across the Pacific" : category}
            </h2>
          </div>
          <p>{shown.length} products</p>
        </div>
        {shown.length ? (
          <div className={s.grid}>
            {shown.map((p) => (
              <article className={s.card} key={p.id}>
                <button
                  className={s.photo}
                  onClick={() => setSelected(p)}
                  aria-label={`View ${p.name}`}
                >
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width:650px) 50vw,25vw"
                  />
                  {p.badge && <span>{p.badge}</span>}
                </button>
                <div className={s.cardBody}>
                  <small>{p.category}</small>
                  <button
                    className={s.productName}
                    onClick={() => setSelected(p)}
                  >
                    {p.name}
                  </button>
                  <div className={s.rating}>
                    ★ {p.rating} <span>({p.reviews})</span>
                  </div>
                  <div className={s.buy}>
                    <strong>A${p.price.toFixed(2)}</strong>
                    <button onClick={() => add(p.id)}>Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={s.empty}>
            <h3>No products found</h3>
            <p>Try another search or category.</p>
          </div>
        )}
      </section>
      <section className={s.sell} id="sell">
        <div>
          <small>SELLER PROGRAMME</small>
          <h2>
            Grow it. Make it.
            <br />
            Sell it across the Pacific.
          </h2>
          <p>
            We’re building a marketplace for Pacific farmers, makers and
            businesses to reach customers across Australia, New Zealand, PNG and
            beyond.
          </p>
        </div>
        <form onSubmit={(e) => e.preventDefault()}>
          <h3>Register your interest</h3>
          <input
            aria-label="Business name"
            placeholder="Business or farm name"
          />
          <input aria-label="Email" type="email" placeholder="Email address" />
          <select aria-label="Country" defaultValue="Papua New Guinea">
            <option>Papua New Guinea</option>
            <option>Australia</option>
            <option>New Zealand</option>
            <option>Fiji</option>
            <option>Solomon Islands</option>
            <option>Other Pacific nation</option>
          </select>
          <textarea
            aria-label="Products"
            placeholder="What do you grow, make or supply?"
          />
          <button type="submit">Submit interest →</button>
        </form>
      </section>
      <footer className={s.footer}>
        <div className={s.brand}>
          <b>≋</b>
          <strong>
            Pasifika<span>Bazaar</span>
          </strong>
        </div>
        <p>One marketplace, built for the Pacific.</p>
        <div>
          <a href="#shop">Shop</a>
          <a href="#sell">Sell with us</a>
          <a href="#">Shipping</a>
          <a href="#">Returns</a>
          <a href="#">Contact</a>
        </div>
        <small>
          © 2026 Pasifika Bazaar. Secure payments powered by Stripe.
        </small>
      </footer>
      {selected && (
        <div className={s.overlay} onClick={() => setSelected(null)}>
          <section
            className={s.modal}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={s.close} onClick={() => setSelected(null)}>
              ×
            </button>
            <div className={s.modalPhoto}>
              <Image
                src={selected.image}
                alt={selected.name}
                fill
                sizes="50vw"
              />
            </div>
            <div className={s.modalInfo}>
              <small>{selected.category}</small>
              <h2>{selected.name}</h2>
              <div className={s.rating}>
                ★ {selected.rating}{" "}
                <span>({selected.reviews} verified reviews)</span>
              </div>
              <p>{selected.description}</p>
              <label>
                Deliver to
                <select>
                  <option>Sydney, Australia</option>
                  <option>Auckland, New Zealand</option>
                  <option>Port Moresby, Papua New Guinea</option>
                  <option>Other Asia-Pacific</option>
                </select>
              </label>
              <strong>A${selected.price.toFixed(2)}</strong>
              <button
                onClick={() => {
                  add(selected.id);
                  setSelected(null);
                }}
              >
                Add to bag
              </button>
              <small>Free first-order shipping with PACIFICFREE</small>
            </div>
          </section>
        </div>
      )}
      {cartOpen && (
        <div className={s.overlay} onClick={() => setCartOpen(false)}>
          <aside
            className={s.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={s.drawerHead}>
              <h2>Your bag</h2>
              <button onClick={() => setCartOpen(false)}>×</button>
            </div>
            {cart.length === 0 ? (
              <div className={s.empty}>
                <h3>Your bag is empty</h3>
                <p>Explore products made for our region.</p>
              </div>
            ) : (
              <>
                <div className={s.cartItems}>
                  {cart.map((id, i) => {
                    const p = products.find((x) => x.id === id)!;
                    return (
                      <div key={`${id}-${i}`}>
                        <Image src={p.image} alt="" width={64} height={64} />
                        <span>
                          <b>{p.name}</b>
                          <small>A${p.price.toFixed(2)}</small>
                        </span>
                        <button
                          aria-label={`Remove ${p.name}`}
                          onClick={() =>
                            setCart((a) => a.filter((_, n) => n !== i))
                          }
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className={s.summary}>
                  <p>
                    <span>Subtotal</span>
                    <b>A${total.toFixed(2)}</b>
                  </p>
                  <small>Shipping and taxes calculated at checkout.</small>
                  <button>Secure checkout</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
