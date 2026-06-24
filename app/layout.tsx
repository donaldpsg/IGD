// app/layout.tsx
import { Providers } from "./providers";
import { fonts } from "./fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fonts.rubik.variable} ${fonts.fwc2026.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
