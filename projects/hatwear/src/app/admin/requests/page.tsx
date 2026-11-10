import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { listRequests } from "@/lib/requests-store";
import { labelFor } from "@/lib/embroidery";

export const metadata: Metadata = { title: "Embroidery requests", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** The owner's inbox for embroidery requests: /admin/requests?token=ADMIN_TOKEN */
export default async function RequestsInbox({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!(await isAdmin(token))) notFound();
  const all = await listRequests();

  return (
    <div className="shell pb-24 pt-10">
      <h1 className="text-5xl uppercase">Embroidery requests</h1>
      <p className="mt-2 text-graphite">
        {all.length} saved on this server. Newest first. Bookmark this page; anyone with the link can read it, so keep the token private.
      </p>
      {all.length === 0 ? (
        <p className="mt-10 bg-felt p-8">No requests yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {all.map((x) => {
            const l = labelFor(x.request);
            const r = x.request;
            return (
              <li key={x.id} className="grid gap-4 bg-chalk p-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-display text-2xl font-black">{x.id}</p>
                  <p className="text-sm text-stone">{new Date(x.receivedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</p>
                  <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="font-semibold">Customer</dt>
                    <dd>
                      {r.name} · {r.phone && <a className="link" href={`tel:${r.phone}`}>{r.phone}</a>} {r.email && <a className="link" href={`mailto:${r.email}?subject=Your HatWear embroidery request ${x.id}`}>{r.email}</a>} · prefers {r.contactMethod}
                    </dd>
                    <dt className="font-semibold">Item</dt>
                    <dd>
                      {l.item} · qty {r.quantity}
                    </dd>
                    <dt className="font-semibold">Design</dt>
                    <dd>
                      {r.text ? `“${r.text}” (${l.font})` : "No text"} · {l.placement} · {l.thread} thread
                    </dd>
                    {r.neededBy && (
                      <>
                        <dt className="font-semibold">Needed by</dt>
                        <dd>{r.neededBy}</dd>
                      </>
                    )}
                    {r.notes && (
                      <>
                        <dt className="font-semibold">Notes</dt>
                        <dd className="whitespace-pre-wrap">{r.notes}</dd>
                      </>
                    )}
                    <dt className="font-semibold">Forwarded</dt>
                    <dd>{x.forwarded ? "Yes" : "No (webhook not set or failed)"}</dd>
                  </dl>
                </div>
                {x.artwork && (
                  <a href={`/api/embroidery/artwork/${x.id}?token=${encodeURIComponent(token!)}`} target="_blank" rel="noopener noreferrer" className="block w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/embroidery/artwork/${x.id}?token=${encodeURIComponent(token!)}`} alt={`Artwork for ${x.id}`} className="aspect-square w-40 bg-felt object-contain" />
                    <span className="mt-1 block truncate text-xs text-stone">{x.artwork.originalName}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
