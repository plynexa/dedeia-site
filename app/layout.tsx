import type { Metadata } from "next";
import "./globals.css";
import "./stock.css";

export const metadata: Metadata = {
  title: "Loja da Dedeia",
  description: "Perfumes, beleza, roupas e acessórios escolhidos com carinho.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
