import Image from "next/image";
import type { Product } from "@/data/types";
import { ProductArt, type ArtView } from "./ProductArt";

const VIEW_INDEX: Record<ArtView, number> = { front: 0, side: 1, back: 2, detail: 3 };

/**
 * Shows real product photography when the catalog has it for this colourway,
 * and the labelled illustration otherwise. Adding photos is purely a data
 * change: put files in /public/products/<slug>/ and list them in `images`.
 */
export function ProductMedia({
  product,
  colorId,
  view = "front",
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  shadow,
}: {
  product: Product;
  colorId?: string;
  view?: ArtView;
  className?: string;
  sizes?: string;
  priority?: boolean;
  shadow?: boolean;
}) {
  const color = product.colorways.find((c) => c.id === colorId) ?? product.colorways[0];
  const photo = product.images?.[color.id]?.[VIEW_INDEX[view]];
  if (photo) {
    return (
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <ProductArt
      type={product.type}
      colors={color.art}
      mark={product.mark}
      view={view}
      shadow={shadow}
      className={className}
      title={`Illustration of the ${product.name} in ${color.name}${view !== "front" ? `, ${view} view` : ""}`}
    />
  );
}

export function hasPhotos(p: Product) {
  return !!p.images && Object.keys(p.images).length > 0;
}
