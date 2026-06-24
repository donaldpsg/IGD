// app/fonts.ts
import { Rubik } from "next/font/google";
import localFont from "next/font/local";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

const fwc2026 = localFont({
  src: [
    {
      path: "../public/fonts/FWC2026-NormalRegular.77c3c249.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/FWC2026-NormalBlack.2bd896c8.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-fwc2026",
});

export const fonts = {
  rubik,
  fwc2026,
};
