import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IM_Fell_English,
  IM_Fell_English_SC,
  Caveat,
} from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  CornerSplash,
} from "@/components/WatercolorUI";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const imFellEnglish = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-im-fell",
  display: "swap",
});

const imFellEnglishSC = IM_Fell_English_SC({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  variable: "--font-im-fell-sc",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jo's Cupcakes — Custom Cupcakes in Austin, TX",
  description:
    "Hand-crafted custom cupcakes for kids' birthdays in Austin, TX. Rainbow princess kittens, roaring dinosaurs, fairy gardens — we bake the magic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${imFellEnglish.variable} ${imFellEnglishSC.variable} ${caveat.variable}`}
    >
      <body className="font-im-fell antialiased min-h-screen bg-page-gradient flex flex-col">
        {/* Global watercolor corner accents — visible on every page */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
          <CornerSplash corner="top-left"     color="#F2C9A8" size={260} className="absolute top-0 left-0" />
          <CornerSplash corner="top-right"    color="#C4AED8" size={200} className="absolute top-0 right-0" />
          <CornerSplash corner="bottom-left"  color="#F0D898" size={180} className="absolute bottom-0 left-0" />
          <CornerSplash corner="bottom-right" color="#E8A0B0" size={220} className="absolute bottom-0 right-0" />
        </div>
        <Nav />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
