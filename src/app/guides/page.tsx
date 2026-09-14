import Link from "next/link";
import s from "../legal.module.css";

export const metadata = { title: "Buying Guides | Pasifika Bazaar", description: "Practical product buying guides for Australia, New Zealand, PNG and Pacific shoppers." };

const guides = [
  { href: "/guides/power-banks-pacific-travel", title: "Choosing a Power Bank for Pacific Travel", text: "Capacity, airline rules, heat, ports and reliability explained in plain language." },
  { href: "/guides/home-backup-power", title: "A Practical Guide to Home Backup Power", text: "How to compare portable power stations for outages, remote homes and everyday use." },
  { href: "/guides/phones-for-remote-travel", title: "What to Look for in a Phone for Remote Travel", text: "Battery life, durability, network compatibility and offline features worth prioritising." },
];

export default function Guides() {
  return <main className={s.page}>
    <header className={s.header}><Link className={s.brand} href="/">Pasifika<span>Bazaar</span></Link><Link href="/">Back to marketplace</Link></header>
    <article className={s.article}><small>PASIFIKA BUYING GUIDES</small><h1>Buy with more confidence</h1><p className={s.updated}>Independent, practical guidance for shoppers across Australia, New Zealand, PNG and the Pacific.</p>
      {guides.map(g => <section key={g.href}><h2><Link href={g.href}>{g.title}</Link></h2><p>{g.text}</p><Link href={g.href}>Read guide →</Link></section>)}
      <section><h2>How we choose topics</h2><p>We focus on products that can be genuinely useful for travel, family life, remote communities and small businesses. Our guides explain what to compare before you visit a retailer. If a guide later contains an affiliate link, it will be clearly disclosed and using it will not increase the price you pay.</p></section>
    </article>
  </main>;
}