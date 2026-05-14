import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IM_Fell_English,
  IM_Fell_English_SC,
  Caveat,
} from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
