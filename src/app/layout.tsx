import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
const body=DM_Sans({subsets:["latin"],variable:"--font-body"});
const display=Manrope({subsets:["latin"],variable:"--font-display"});
export const metadata:Metadata={title:"Pasifika Bazaar | Product Discovery for the Pacific",description:"Discover curated products from leading online retailers for shoppers across Australia, New Zealand, PNG and the Pacific.",metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pasifika-bazaar.vercel.app")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${body.variable} ${display.variable}`}>{children}</body></html>}
