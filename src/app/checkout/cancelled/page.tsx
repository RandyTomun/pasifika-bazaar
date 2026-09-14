import Link from "next/link";
import styles from "../status.module.css";
export default function CancelledPage(){return <main className={styles.page}><section><span>←</span><h1>Checkout cancelled</h1><p>No payment was taken. You can return to the marketplace and try again whenever you’re ready.</p><Link href="/">Return to the bazaar</Link></section></main>}
