import { fullAddress, mapLinks, site } from "@/content/site";
import { InstagramIcon, PhoneIcon, PinIcon } from "./Icons";

export function HoursList({ dark = false }: { dark?: boolean }) {
  if (!site.hours) {
    return (
      <p className={dark ? "text-bone/80" : "text-graphite"}>
        Hours are being confirmed.{" "}
        <a href={`tel:${site.phone.tel}`} className="link font-semibold">
          Call {site.phone.display}
        </a>{" "}
        before you head over.
      </p>
    );
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 tabular-nums">
      {site.hours.map((h) => (
        <div key={h.days} className="contents">
          <dt className="font-semibold">{h.days}</dt>
          <dd>
            {h.opens} to {h.closes}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function StoreActions({ dark = false }: { dark?: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
        <PinIcon size={19} /> Directions
      </a>
      <a href={`tel:${site.phone.tel}`} className={`btn btn-ghost ${dark ? "btn-ghost-light" : "btn-ghost-dark"}`}>
        <PhoneIcon size={19} /> Call
      </a>
      <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className={`btn btn-ghost ${dark ? "btn-ghost-light" : "btn-ghost-dark"}`}>
        <InstagramIcon size={19} /> Instagram
      </a>
    </div>
  );
}

export function MapFrame({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-felt ${className}`}>
      {/* Fallback underneath the map, visible if the embed is blocked. */}
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="link font-semibold">
          Open {fullAddress} in Google Maps
        </a>
      </div>
      <iframe
        title={`Map showing HatWear at ${fullAddress}`}
        src={mapLinks.embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="relative size-full border-0 grayscale-[35%] contrast-[1.05]"
      />
    </div>
  );
}

export function AddressBlock({ dark = false }: { dark?: boolean }) {
  return (
    <address className="not-italic">
      <span className={`block font-display text-[clamp(2.4rem,1.4rem+4vw,4.6rem)] font-black uppercase leading-[0.86] ${dark ? "" : ""}`}>
        {site.address.street}
      </span>
      <span className={`mt-2 block text-lg ${dark ? "text-bone/80" : "text-graphite"}`}>
        {site.address.city}, {site.address.region} {site.address.postalCode}
      </span>
      <a href={`tel:${site.phone.tel}`} className="mt-1 inline-block text-lg font-semibold hover:underline">
        {site.phone.display}
      </a>
    </address>
  );
}
