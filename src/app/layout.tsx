import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CO₂ FieldLab — FEM Simulator",
  description: "Simulateur interactif 3D de transport diffusif du CO₂, éléments finis P1.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
