"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ProductArt, type ArtView, type Placement } from "../ProductArt";
import { CheckIcon, CloseIcon, UploadIcon, ArrowIcon, PhoneIcon } from "../Icons";
import { QtyStepper } from "../CartDrawer";
import {
  BASES,
  FONTS,
  LIMITS,
  THREADS,
  labelFor,
  placementsFor,
  validateContact,
  validateDesign,
  type EmbroideryRequest,
  type FieldErrors,
} from "@/lib/embroidery";
import { embroideryPricing, site } from "@/content/site";
import { money } from "@/lib/format";
import type { ProductType } from "@/data/types";

const STEPS = ["Product", "Customize", "Preview", "Send"] as const;

const viewFor = (p: Placement): ArtView => (p === "side" ? "side" : p === "back" || p === "full-back" ? "back" : "front");

const GARMENT: Placement[] = ["left-chest", "center-chest", "full-back"];

type Status = { state: "idle" } | { state: "sending" } | { state: "sent"; id: string } | { state: "error"; message: string };

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-sign-deep">
      {msg}
    </p>
  );
}

export function Studio({ initialBase, initialColor }: { initialBase?: string; initialColor?: string }) {
  const uid = useId();
  const startBase = (BASES.some((b) => b.type === initialBase) ? initialBase : "fitted") as ProductType;
  const startColor = BASES.find((b) => b.type === startBase)!.colors.find((c) => initialColor?.includes(c.id))?.id ?? BASES.find((b) => b.type === startBase)!.colors[0].id;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [r, setR] = useState<EmbroideryRequest>({
    baseType: startBase,
    baseColor: startColor,
    ownItem: "",
    text: "",
    font: "block",
    placement: placementsFor(startBase)[0].id,
    thread: "white",
    quantity: 1,
    notes: "",
    name: "",
    email: "",
    phone: "",
    contactMethod: "text",
    neededBy: "",
    hasArtwork: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [previewView, setPreviewView] = useState<ArtView>("front");
  const [honeypot, setHoneypot] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof EmbroideryRequest>(k: K, v: EmbroideryRequest[K]) => {
    setR((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, ...(k === "text" ? { design: undefined } : {}) }));
  };

  useEffect(() => setPreviewView(viewFor(r.placement)), [r.placement]);
  useEffect(() => () => void (fileUrl && URL.revokeObjectURL(fileUrl)), [fileUrl]);

  const base = BASES.find((b) => b.type === r.baseType);
  const placements = placementsFor(r.baseType);

  // What the preview draws.
  const previewType: ProductType = r.baseType === "own" ? (GARMENT.includes(r.placement) ? "hoodie" : "fitted") : r.baseType;
  const previewColors =
    r.baseType === "own"
      ? (BASES.find((b) => b.type === previewType)?.colors[0].art ?? BASES[0].colors[0].art)
      : (base?.colors.find((c) => c.id === r.baseColor)?.art ?? BASES[0].colors[0].art);
  const thread = THREADS.find((t) => t.id === r.thread)!;
  const overlay = { placement: r.placement, text: r.text.trim() || undefined, font: r.font as "block" | "athletic" | "script", thread: thread.hex, image: fileUrl || undefined };
  const availableViews: ArtView[] = previewType === "beanie" || previewType === "hoodie" || previewType === "windbreaker" ? ["front", "back"] : ["front", "side", "back"];

  const onFile = (f: File | null) => {
    setFileError("");
    if (!f) return;
    if (!LIMITS.fileTypes.includes(f.type)) {
      setFileError("Upload a PNG, JPG or WebP image. Have a PDF or vector file? Mention it in the notes and bring it in.");
      return;
    }
    if (f.size > LIMITS.fileMaxBytes) {
      setFileError("That file is over 8 MB. Export a smaller PNG or JPG.");
      return;
    }
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    set("hasArtwork", true);
  };

  const clearFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl("");
    set("hasArtwork", false);
  };

  const goto = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const next = () => {
    if (step === 0) {
      const e = validateDesign({ ...r, text: "x" }); // only product fields matter here
      const pick = { baseType: e.baseType, baseColor: e.baseColor, ownItem: e.ownItem };
      if (Object.values(pick).some(Boolean)) return setErrors(pick);
    }
    if (step === 1) {
      const e = validateDesign(r);
      if (Object.keys(e).length) return setErrors(e);
    }
    goto(step + 1);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = { ...validateDesign(r), ...validateContact(r) };
    if (Object.keys(e).length) {
      setErrors(e);
      const designKeys = ["baseType", "baseColor", "ownItem", "text", "design", "placement", "thread", "quantity", "notes", "font"];
      if (Object.keys(e).some((k) => designKeys.includes(k))) goto(1);
      return;
    }
    setStatus({ state: "sending" });
    const fd = new FormData();
    fd.set("payload", JSON.stringify(r));
    fd.set("company_website", honeypot);
    if (file) fd.set("artwork", file);
    try {
      const res = await fetch("/api/embroidery", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setStatus({ state: "error", message: data.message ?? "The request didn't go through. Please try again, or call the store." });
        return;
      }
      setStatus({ state: "sent", id: data.id });
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setStatus({ state: "error", message: "We couldn't reach the server. Check your connection and try again, or call the store." });
    }
  };

  const labels = useMemo(() => labelFor(r), [r]);

  const estimate =
    embroideryPricing.verified && embroideryPricing.startingPrice != null
      ? embroideryPricing.startingPrice * r.quantity + (file && embroideryPricing.customArtworkSetup ? embroideryPricing.customArtworkSetup : 0)
      : null;

  if (status.state === "sent") {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 bg-ink p-8 text-bone sm:p-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="aspect-square bg-charcoal">
            <ProductArt type={previewType} colors={previewColors} view={viewFor(r.placement)} embroidery={overlay} className="size-full" />
          </div>
          <div className="self-center">
            <span className="grid size-14 place-items-center rounded-full bg-sign text-white">
              <CheckIcon size={28} />
            </span>
            <h2 className="mt-5 text-[clamp(2.6rem,1.8rem+3vw,4.4rem)] uppercase">Request sent</h2>
            <p className="mt-3 text-lg text-bone/85">
              Thanks, {r.name.split(" ")[0]}. HatWear has your request and will reach you by {r.contactMethod === "email" ? "email" : r.contactMethod === "text" ? "text" : "phone"} to confirm the details, price and timing. Nothing is made or charged until you agree to the quote.
            </p>
            <p className="mt-5 font-semibold">
              Reference: <span className="font-display text-2xl tracking-wide">{status.id}</span>
            </p>
            <p className="mt-1 text-sm text-bone/60">Mention it if you call or visit.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:${site.phone.tel}`} className="btn btn-primary">
                <PhoneIcon size={18} /> Call the store
              </a>
              <button
                type="button"
                onClick={() => {
                  setStatus({ state: "idle" });
                  clearFile();
                  setR((x) => ({ ...x, text: "", notes: "" }));
                  goto(0);
                }}
                className="btn btn-ghost btn-ghost-light"
              >
                Start another
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="grid scroll-mt-24 gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
      {/* Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-square overflow-hidden bg-felt twill-light">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${previewType}-${previewView}-${r.baseColor}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 p-[4%]"
            >
              <ProductArt
                type={previewType}
                colors={previewColors}
                view={previewView}
                embroidery={overlay}
                className="size-full"
                title={`Approximate preview of ${labels.item} with ${r.text ? `"${r.text}"` : "your artwork"} at ${labels.placement}`}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute left-3 top-3 flex gap-1 rounded-sm bg-bone/90 p-1" role="group" aria-label="Preview angle">
            {availableViews.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPreviewView(v)}
                aria-pressed={previewView === v}
                className={`h-9 rounded-[2px] px-3 text-sm font-semibold capitalize ${previewView === v ? "bg-ink text-bone" : "hover:bg-felt"}`}
              >
                {v}
              </button>
            ))}
          </div>
          {viewFor(r.placement) !== previewView && (r.text || fileUrl) && (
            <button type="button" onClick={() => setPreviewView(viewFor(r.placement))} className="absolute inset-x-0 bottom-12 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bone">
              Your design is on the {labels.placement.toLowerCase()}. Show it
            </button>
          )}
          <p className="absolute bottom-3 left-4 right-4 text-xs text-graphite">
            Approximate preview, not a production proof. Final size, colour and placement are confirmed with you before stitching.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div>
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && goto(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className="w-full text-left disabled:cursor-default"
              >
                <span className={`block h-1.5 rounded-full transition-colors ${i <= step ? "bg-sign" : "bg-ink/15"}`} />
                <span className={`mt-2 block text-sm ${i === step ? "font-semibold" : "text-stone"}`}>
                  {i + 1}. {s}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <form onSubmit={submit} noValidate className="mt-8">
          {/* Honeypot for bots: hidden from people and assistive tech. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Company website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>

          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={{ enter: (d: number) => ({ opacity: 0, x: d * 30 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: d * -30 }) }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            >
              {step === 0 && (
                <div className="space-y-8">
                  <fieldset>
                    <legend className="font-display text-3xl font-black uppercase">What are we stitching?</legend>
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {[...BASES.map((b) => ({ type: b.type as ProductType | "own", label: b.label, note: b.note })), { type: "own" as const, label: "My own item", note: "Bring it to the store" }].map((b) => {
                        const on = r.baseType === b.type;
                        const art = b.type === "own" ? null : BASES.find((x) => x.type === b.type)!;
                        return (
                          <label key={b.type} className={`relative flex cursor-pointer flex-col overflow-hidden rounded-sm border-[1.5px] transition-colors ${on ? "border-ink bg-chalk" : "border-ink/15 hover:border-ink/50"}`}>
                            <input
                              type="radio"
                              name={`${uid}-base`}
                              checked={on}
                              onChange={() => {
                                setR((x) => ({
                                  ...x,
                                  baseType: b.type,
                                  baseColor: art ? art.colors[0].id : x.baseColor,
                                  placement: placementsFor(b.type)[0].id,
                                }));
                                setErrors({});
                              }}
                              className="peer sr-only"
                            />
                            <span className="aspect-[5/4] bg-felt peer-focus-visible:outline-2 peer-focus-visible:outline-sign">
                              {art ? (
                                <ProductArt type={art.type} colors={art.colors[0].art} className="size-full p-2" shadow={false} />
                              ) : (
                                <span className="grid size-full place-items-center font-display text-4xl font-black text-stone">BYO</span>
                              )}
                            </span>
                            <span className="p-3">
                              <span className="block font-semibold">{b.label}</span>
                              <span className="block text-sm text-stone">{b.note}</span>
                            </span>
                            {on && (
                              <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-ink text-bone">
                                <CheckIcon size={14} />
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    <FieldError id={`${uid}-base-err`} msg={errors.baseType} />
                  </fieldset>

                  {base && (
                    <fieldset>
                      <legend className="font-semibold">
                        Colour <span className="font-normal text-stone">· {base.colors.find((c) => c.id === r.baseColor)?.name}</span>
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {base.colors.map((c) => (
                          <label key={c.id} className="cursor-pointer" title={c.name}>
                            <input type="radio" name={`${uid}-color`} checked={r.baseColor === c.id} onChange={() => set("baseColor", c.id)} className="peer sr-only" />
                            <span
                              className="block size-11 rounded-full ring-1 ring-ink/20 ring-offset-2 ring-offset-bone peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-sign"
                              style={{ background: `linear-gradient(135deg, ${c.art.crown} 0 55%, ${c.art.visor} 55% 100%)` }}
                            />
                            <span className="sr-only">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {r.baseType === "own" && (
                    <div>
                      <label htmlFor={`${uid}-own`} className="font-semibold">
                        What will you bring in?
                      </label>
                      <input
                        id={`${uid}-own`}
                        value={r.ownItem}
                        onChange={(e) => set("ownItem", e.target.value)}
                        placeholder="e.g. Black Carhartt beanie, my team's jerseys"
                        maxLength={120}
                        className="field mt-2"
                        aria-invalid={!!errors.ownItem}
                        aria-describedby={errors.ownItem ? `${uid}-own-err` : undefined}
                      />
                      <FieldError id={`${uid}-own-err`} msg={errors.ownItem} />
                      <p className="mt-2 text-sm text-stone">Some materials and shapes can't be embroidered. The store will confirm when they see it.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <h2 className="font-display text-3xl font-black uppercase">Add your mark</h2>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <label htmlFor={`${uid}-text`} className="font-semibold">
                        Text
                      </label>
                      <span className="text-sm tabular-nums text-stone">
                        {r.text.length}/{LIMITS.textMax}
                      </span>
                    </div>
                    <input
                      id={`${uid}-text`}
                      value={r.text}
                      onChange={(e) => set("text", e.target.value.slice(0, LIMITS.textMax))}
                      placeholder="Name, number, initials, crew…"
                      className="field mt-2 text-lg"
                      aria-invalid={!!(errors.text || errors.design)}
                      aria-describedby={`${uid}-design-err`}
                      autoComplete="off"
                    />
                    <FieldError id={`${uid}-text-err`} msg={errors.text} />
                  </div>

                  <fieldset>
                    <legend className="font-semibold">Lettering</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {FONTS.map((f) => (
                        <label key={f.id} className="cursor-pointer">
                          <input type="radio" name={`${uid}-font`} checked={r.font === f.id} onChange={() => set("font", f.id)} className="peer sr-only" />
                          <span className="flex h-16 flex-col items-center justify-center rounded-sm border-[1.5px] border-ink/20 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bone peer-focus-visible:outline-2 peer-focus-visible:outline-sign">
                            <span
                              className="text-2xl leading-none"
                              style={{
                                fontFamily: f.id === "script" ? "var(--font-script)" : f.id === "block" ? "var(--font-display)" : "var(--font-sans)",
                                fontWeight: f.id === "script" ? 400 : 800,
                                fontStyle: f.id === "athletic" ? "italic" : "normal",
                              }}
                            >
                              {r.text.trim().slice(0, 6) || "Abc"}
                            </span>
                            <span className="mt-1 text-xs opacity-80">{f.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <p className="font-semibold">Artwork or logo (optional)</p>
                    {file ? (
                      <div className="mt-2 flex items-center gap-3 rounded-sm border-[1.5px] border-ink/20 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fileUrl} alt="" className="size-14 rounded-sm bg-felt object-contain" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{file.name}</p>
                          <p className="text-sm text-stone">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button type="button" onClick={clearFile} className="grid size-10 place-items-center rounded-full hover:bg-felt" aria-label="Remove artwork">
                          <CloseIcon size={18} />
                        </button>
                      </div>
                    ) : (
                      <label
                        className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border-[1.5px] border-dashed border-ink/35 px-4 py-6 text-center hover:border-ink focus-within:outline-2 focus-within:outline-sign"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          onFile(e.dataTransfer.files?.[0] ?? null);
                        }}
                      >
                        <UploadIcon size={26} />
                        <span className="font-semibold">Upload or drop an image</span>
                        <span className="text-sm text-stone">PNG, JPG or WebP, up to 8 MB. Transparent PNGs preview best.</span>
                        <input type="file" accept={LIMITS.fileTypes.join(",")} onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="sr-only" />
                      </label>
                    )}
                    <FieldError id={`${uid}-file-err`} msg={fileError} />
                    <p className="mt-2 text-sm text-stone">Only upload artwork you own or have permission to use. Logos are digitized for embroidery by the store.</p>
                  </div>
                  <FieldError id={`${uid}-design-err`} msg={errors.design} />

                  <fieldset>
                    <legend className="font-semibold">Placement</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {placements.map((p) => (
                        <label key={p.id} className="cursor-pointer">
                          <input type="radio" name={`${uid}-place`} checked={r.placement === p.id} onChange={() => set("placement", p.id)} className="peer sr-only" />
                          <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-ink/25 px-4 font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bone peer-focus-visible:outline-2 peer-focus-visible:outline-sign">
                            {p.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <FieldError id={`${uid}-place-err`} msg={errors.placement} />
                  </fieldset>

                  <fieldset>
                    <legend className="font-semibold">
                      Thread <span className="font-normal text-stone">· {thread.name}</span>
                    </legend>
                    <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12">
                      {THREADS.map((t) => (
                        <label key={t.id} className="cursor-pointer" title={t.name}>
                          <input type="radio" name={`${uid}-thread`} checked={r.thread === t.id} onChange={() => set("thread", t.id)} className="peer sr-only" />
                          <span
                            className="block aspect-square rounded-full ring-1 ring-ink/25 ring-offset-2 ring-offset-bone peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-sign"
                            style={{ background: `repeating-linear-gradient(-35deg, ${t.hex} 0 3px, color-mix(in srgb, ${t.hex} 78%, black) 3px 4px)` }}
                          />
                          <span className="sr-only">{t.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold" id={`${uid}-qty`}>
                        Quantity
                      </p>
                      <p className="text-sm text-stone">Ordering for a team or business? Put the full count.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <QtyStepper value={r.quantity} max={LIMITS.qtyMax} onChange={(n) => set("quantity", Math.max(1, n))} label="Quantity" size="md" />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={LIMITS.qtyMax}
                        value={r.quantity}
                        onChange={(e) => set("quantity", Math.max(1, Math.min(LIMITS.qtyMax, Number(e.target.value) || 1)))}
                        className="field !min-h-12 w-24"
                        aria-labelledby={`${uid}-qty`}
                      />
                    </div>
                  </div>
                  <FieldError id={`${uid}-qty-err`} msg={errors.quantity} />

                  <div>
                    <label htmlFor={`${uid}-notes`} className="font-semibold">
                      Special instructions <span className="font-normal text-stone">(optional)</span>
                    </label>
                    <textarea
                      id={`${uid}-notes`}
                      value={r.notes}
                      onChange={(e) => set("notes", e.target.value.slice(0, LIMITS.notesMax))}
                      rows={4}
                      placeholder="Sizes for a team order, exact thread match, a deadline, anything we should know."
                      className="field mt-2"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-3xl font-black uppercase">Check it over</h2>
                  <dl className="mt-5 divide-y divide-ink/10 border-y-2 border-ink">
                    {[
                      ["Item", labels.item, 0],
                      ["Text", r.text ? `“${r.text}” in ${labels.font}` : "None", 1],
                      ["Artwork", file ? file.name : "None", 1],
                      ["Placement", labels.placement, 1],
                      ["Thread", labels.thread, 1],
                      ["Quantity", String(r.quantity), 1],
                      ["Notes", r.notes || "None", 1],
                    ].map(([k, v, s]) => (
                      <div key={k as string} className="grid grid-cols-[7rem_1fr_auto] items-start gap-3 py-3">
                        <dt className="font-semibold">{k}</dt>
                        <dd className="break-words text-graphite">{v}</dd>
                        <dd>
                          <button type="button" onClick={() => goto(s as number)} className="text-sm font-semibold underline underline-offset-2">
                            Edit
                          </button>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 bg-chalk p-5">
                    <p className="font-display text-2xl font-black uppercase">
                      {estimate != null ? `Estimate ${money(estimate)}` : embroideryPricing.advertisedFrom != null ? `From ${money(embroideryPricing.advertisedFrom)} · request a quote` : "Request a quote"}
                    </p>
                    <p className="mt-1 text-graphite">
                      {estimate != null
                        ? "Estimated from the store's current pricing. The final price is confirmed before work starts."
                        : `Embroidery starts at ${embroideryPricing.advertisedFrom != null ? money(embroideryPricing.advertisedFrom) : "a low base price"}. The exact price depends on the item, stitch count, placement and quantity, and HatWear confirms it with you before anything is made.`}
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="font-display text-3xl font-black uppercase">Where should we reply?</h2>
                  <div>
                    <label htmlFor={`${uid}-name`} className="font-semibold">
                      Name
                    </label>
                    <input id={`${uid}-name`} value={r.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" className="field mt-2" aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-err` : undefined} />
                    <FieldError id={`${uid}-name-err`} msg={errors.name} />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`${uid}-phone`} className="font-semibold">
                        Phone
                      </label>
                      <input id={`${uid}-phone`} type="tel" value={r.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" className="field mt-2" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${uid}-phone-err` : undefined} />
                      <FieldError id={`${uid}-phone-err`} msg={errors.phone} />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-email`} className="font-semibold">
                        Email
                      </label>
                      <input id={`${uid}-email`} type="email" value={r.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className="field mt-2" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-err` : undefined} />
                      <FieldError id={`${uid}-email-err`} msg={errors.email} />
                    </div>
                  </div>
                  <fieldset>
                    <legend className="font-semibold">Best way to reach you</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["text", "phone", "email"] as const).map((m) => (
                        <label key={m} className="cursor-pointer">
                          <input type="radio" name={`${uid}-method`} checked={r.contactMethod === m} onChange={() => set("contactMethod", m)} className="peer sr-only" />
                          <span className="inline-flex h-11 items-center rounded-full border-[1.5px] border-ink/25 px-4 font-semibold capitalize peer-checked:border-ink peer-checked:bg-ink peer-checked:text-bone peer-focus-visible:outline-2 peer-focus-visible:outline-sign">
                            {m === "phone" ? "Call" : m}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor={`${uid}-date`} className="font-semibold">
                      Need it by <span className="font-normal text-stone">(optional)</span>
                    </label>
                    <input id={`${uid}-date`} type="date" value={r.neededBy} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set("neededBy", e.target.value)} className="field mt-2 sm:w-60" />
                    <FieldError id={`${uid}-date-err`} msg={errors.neededBy} />
                  </div>
                  <p className="text-sm text-stone">We only use your details to reply about this request.</p>
                  {status.state === "error" && (
                    <p role="alert" className="border-l-4 border-sign bg-chalk p-4 font-semibold">
                      {status.message}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-ink/15 pt-6">
            {step > 0 ? (
              <button type="button" onClick={() => goto(step - 1)} className="btn btn-ghost btn-ghost-dark">
                Back
              </button>
            ) : (
              <Link href="/store" className="text-sm font-semibold underline underline-offset-2">
                Prefer to talk it through in store?
              </Link>
            )}
            {step < 3 ? (
              <button type="button" onClick={next} className="btn btn-dark group">
                {step === 2 ? "Looks right" : "Next"} <ArrowIcon size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button type="submit" disabled={status.state === "sending"} className="btn btn-primary">
                {status.state === "sending" ? "Sending…" : "Send request"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
