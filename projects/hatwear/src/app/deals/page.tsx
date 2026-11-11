import type { Metadata } from "next";
import { DealsPage } from "./DealsPage";

export const metadata: Metadata = {
  title: "Limited-time deals",
  description: "Limited-time deal prices on hats, beanies and hoodies at HatWear in Stockton, CA.",
  alternates: { canonical: "/deals" },
};

export default function Page() {
  return <DealsPage />;
}
