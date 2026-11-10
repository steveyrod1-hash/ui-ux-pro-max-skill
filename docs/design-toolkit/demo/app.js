// Saltmarrow Rockpool Club demo. Motion (vendored UMD build) is on window.Motion.
// Tide figures come from a simple harmonic model so the page needs no API.
(() => {
  "use strict";

  const { animate, scroll, press } = window.Motion;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Tide model ----------------------------------------------------
  const PERIOD = 12.42;         // hours between high waters (semi-diurnal)
  const FIRST_HIGH = 3.3;       // hours after today's midnight
  const MEAN = 2.55;            // metres above chart datum
  const SPRING_NEAP = 14.77;    // days

  const amplitude = (day) => 1.75 + 0.55 * Math.cos((2 * Math.PI * day) / SPRING_NEAP);
  const heightAt = (hours) => {
    const day = hours / 24;
    return MEAN + amplitude(day) * Math.cos((2 * Math.PI * (hours - FIRST_HIGH)) / PERIOD);
  };

  const SAMPLES = 97;
  const samplesFor = (day) =>
    Array.from({ length: SAMPLES }, (_, i) => heightAt(day * 24 + (i / (SAMPLES - 1)) * 24));

  // Low waters fall half a period after each high water.
  const lowsFor = (day) => {
    const start = day * 24, end = start + 24, lows = [];
    let k = Math.ceil((start - FIRST_HIGH - PERIOD / 2) / PERIOD);
    for (let t = FIRST_HIGH + PERIOD / 2 + k * PERIOD; t < end; t = FIRST_HIGH + PERIOD / 2 + ++k * PERIOD) {
      if (t >= start) lows.push({ hours: t - start, height: heightAt(t) });
    }
    return lows.sort((a, b) => a.height - b.height);
  };

  // ---------- Formatting ----------------------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateFor = (day, hours = 0) => new Date(today.getTime() + (day * 24 + hours) * 3600e3);
  const clock = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const weekday = (d, style = "short") => d.toLocaleDateString([], { weekday: style });
  const longDate = (d) => d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const metres = (h) => `${Math.max(0, h).toFixed(1)} m`;

  // ---------- Chart geometry ------------------------------------------------
  const W = 1000, H = 300, MAX_M = 5;
  const x = (i) => (i / (SAMPLES - 1)) * W;
  const y = (h) => H - (h / MAX_M) * H;
  const linePath = (hs) => hs.map((h, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(h).toFixed(1)}`).join(" ");
  const areaPath = (hs) => `${linePath(hs)} L${W} ${H} L0 ${H} Z`;

  const $ = (sel) => document.querySelector(sel);
  const curve = $("[data-curve]");
  const water = $("[data-water]");
  const lowDot = $("[data-low-dot]");
  const lowRule = $("[data-low-rule]");
  const lowTime = $("[data-low-time]");
  const summary = $("[data-low-summary]");
  const dayList = $("[data-days]");

  let current = { day: 0, heights: samplesFor(0), low: lowsFor(0)[0] };

  const drawFrame = (heights, low) => {
    curve.setAttribute("d", linePath(heights));
    water.setAttribute("d", areaPath(heights));
    const lx = (low.hours / 24) * W;
    lowDot.setAttribute("cx", lx);
    lowDot.setAttribute("cy", y(low.height));
    lowRule.setAttribute("x1", lx);
    lowRule.setAttribute("x2", lx);
  };

  const describe = (day) => {
    const [best, other] = lowsFor(day);
    const when = dateFor(day, best.hours);
    lowTime.textContent = clock(when);
    let text = `${longDate(when)}: ${metres(best.height)} above datum.`;
    if (other) text += ` The day's other low is at ${clock(dateFor(day, other.hours))} (${metres(other.height)}).`;
    summary.textContent = text;
  };

  // ---------- Day picker ----------------------------------------------------
  const buttons = Array.from({ length: 7 }, (_, day) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "day";
    b.dataset.day = day;
    b.setAttribute("aria-pressed", String(day === 0));
    const low = lowsFor(day)[0];
    b.innerHTML = `${day === 0 ? "Today" : weekday(dateFor(day))}<strong>${clock(dateFor(day, low.hours))}</strong>`;
    b.setAttribute("aria-label", `${longDate(dateFor(day))}, low water ${clock(dateFor(day, low.hours))}`);
    dayList.append(b);
    return b;
  });

  let transition;
  const selectDay = (day) => {
    if (day === current.day) return;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.day) === day)));
    describe(day);

    const from = current, to = { day, heights: samplesFor(day), low: lowsFor(day)[0] };
    current = to;
    transition?.stop();
    if (reduceMotion.matches) return drawFrame(to.heights, to.low);

    // Morph the whole curve: the change answers the click, so it is allowed to move.
    transition = animate(0, 1, {
      duration: 0.7,
      ease: "easeInOut",
      onUpdate: (p) => {
        const mix = (a, b) => a + (b - a) * p;
        drawFrame(
          from.heights.map((h, i) => mix(h, to.heights[i])),
          { hours: mix(from.low.hours, to.low.hours), height: mix(from.low.height, to.low.height) },
        );
      },
    });
  };
  dayList.addEventListener("click", (e) => {
    const b = e.target.closest(".day");
    if (b) selectDay(Number(b.dataset.day));
  });

  // ---------- First paint: the page's one orchestrated moment ---------------
  describe(0);
  drawFrame(current.heights, current.low);

  if (!reduceMotion.matches) {
    const length = curve.getTotalLength();
    curve.style.strokeDasharray = `${length}`;
    animate(curve, { strokeDashoffset: [length, 0] }, { duration: 1.6, ease: "easeInOut" })
      .then(() => { curve.style.strokeDasharray = ""; });
    animate(water, { opacity: [0, 1] }, { duration: 1.2, delay: 0.6 });
    animate([lowDot, lowRule], { opacity: [0, 1] }, { duration: 0.3, delay: 1.4 });
    animate(lowDot, { r: [0, 9] }, { type: "spring", stiffness: 420, damping: 18, delay: 1.4 });

    // Tactile feedback on the day buttons.
    press(".day", (el) => {
      animate(el, { scale: 0.95 }, { duration: 0.08 });
      return () => animate(el, { scale: 1 }, { type: "spring", stiffness: 600, damping: 25 });
    });
  }

  // ---------- Shore: scrolling lowers the tide ------------------------------
  // Bands are 20 / 24 / 32 / 24 % tall, so 20% shows the splash zone only and
  // 94% leaves just a sliver of sea over the lower shore.
  const sea = $("[data-sea]");
  const zones = $(".zones");
  let stopScroll;
  const linkShore = () => {
    stopScroll?.();
    if (reduceMotion.matches) {
      sea.style.transform = "translateY(94%)";
      return;
    }
    stopScroll = scroll(
      animate(sea, { transform: ["translateY(20%)", "translateY(94%)"] }, { ease: "linear" }),
      { target: zones, offset: ["start 0.6", "end 0.6"] },
    );
  };
  linkShore();
  reduceMotion.addEventListener("change", linkShore);

  // ---------- Calendar reminder (.ics, no server) ---------------------------
  const remind = $("[data-remind]");
  const status = $("[data-remind-status]");
  remind.addEventListener("click", () => {
    const low = current.low;
    const start = dateFor(current.day, low.hours - 1);
    const end = dateFor(current.day, low.hours + 0.5);
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saltmarrow Rockpool Club//Demo//EN",
      "BEGIN:VEVENT",
      `UID:${stamp(start)}-low@saltmarrow.example`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:Rockpooling, low water ${clock(dateFor(current.day, low.hours))} (${metres(low.height)})`,
      "DESCRIPTION:Arrive an hour before low water and turn back when the tide turns.",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "saltmarrow-low-tide.ics" });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    status.textContent = `Calendar reminder downloaded for ${longDate(start)}, from ${clock(start)}.`;
  });
})();
