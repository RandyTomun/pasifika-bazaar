import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";
const body=DM_Sans({subsets:["latin"],variable:"--font-body"});
const display=Manrope({subsets:["latin"],variable:"--font-display"});
export const metadata:Metadata={title:"Pasifika Bazaar | The Pacific Marketplace",description:"Shop products for families, lifestyle and business across Australia, New Zealand, PNG and the Asia-Pacific."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${body.variable} ${display.variable}`}>{children}</body></html>}
