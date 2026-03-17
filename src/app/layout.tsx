import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conscious Speech Strategies | Holistic Speech Therapy | Gulfport, FL",
  description:
    "Conscious Speech Strategies provides holistic school-based and private group speech therapy services integrating mind, body, and spirit. Located in Gulfport, FL.",
  keywords:
    "speech therapy, speech language pathologist, Gulfport FL, holistic speech therapy, stuttering, articulation, literacy, neurodiversity, school based therapy",
  metadataBase: new URL("https://consciousspeech.net"),
  openGraph: {
    title: "Conscious Speech Strategies | Holistic Speech Therapy",
    description:
      "Where communication transforms into a vibrant expression of self. Holistic speech-language therapy integrating mind, body, and spirit.",
    type: "website",
    locale: "en_US",
    siteName: "Conscious Speech Strategies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conscious Speech Strategies | Holistic Speech Therapy",
    description:
      "Where communication transforms into a vibrant expression of self. Holistic speech-language therapy integrating mind, body, and spirit.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
