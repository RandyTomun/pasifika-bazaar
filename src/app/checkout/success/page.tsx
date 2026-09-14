import Link from "next/link";
import styles from "../status.module.css";
export default function SuccessPage(){return <main className={styles.page}><section><span>✓</span><h1>Payment received</h1><p>Thank you for shopping with Pasifika Bazaar. Stripe will send your payment receipt to the email address used at checkout.</p><Link href="/">Continue shopping</Link></section></main>}
