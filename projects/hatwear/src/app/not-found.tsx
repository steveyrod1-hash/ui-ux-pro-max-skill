import Link from "next/link";
import { ProductArt } from "@/components/ProductArt";

export default function NotFound() {
  return (
    <div className="shell grid items-center gap-8 py-20 md:grid-cols-2">
      <div>
        <p className="text-stone">404</p>
        <h1 className="mt-2 text-[clamp(3rem,1.6rem+6vw,7rem)] uppercase">Not on the wall</h1>
        <p className="mt-4 max-w-md text-lg text-graphite">That page doesn't exist, or the product has moved. Try the shop or search for it.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop headwear
          </Link>
          <Link href="/" className="btn btn-ghost btn-ghost-dark">
            Home
          </Link>
        </div>
      </div>
      <ProductArt
        type="fitted"
        view="side"
        mark="404"
        colors={{ crown: "#1c1b1a", visor: "#1c1b1a", under: "#2a2a2a", button: "#2557b8", mark: "#2557b8" }}
        className="mx-auto w-full max-w-md"
      />
    </div>
  );
}
