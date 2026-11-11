/**
 * A local stand-in for Clover's REST + Ecommerce APIs and iframe SDK, used by
 * tests/clover-checkout.mjs. It mimics the documented request/response shapes
 * closely enough to exercise the integration without a real Clover account.
 */
import http from "node:http";

export const MID = "TESTMERCHANT1";
export const REST_TOKEN = "test-rest-token";
export const ECOMM_KEY = "test-ecomm-private";

const attr = (id, name, options) => ({ id, name, options: { elements: options.map(([oid, oname]) => ({ id: oid, name: oname })) } });
const ATTRIBUTES = [
  attr("ATTR_SIZE", "Size", [["O_714", "7 1/4"], ["O_738", "7 3/8"], ["O_712", "7 1/2"]]),
  attr("ATTR_COLOR", "Color", [["O_BLK", "Black"], ["O_NVY", "Navy/White"]]),
];

const now = Date.now();
const fitted = (id, size, color, qty) => ({
  id,
  name: `Giants Fitted ${color} ${size}`,
  price: 4699,
  hidden: false,
  modifiedTime: now,
  itemGroup: { id: "GRP_GIANTS", name: "San Francisco Giants 59FIFTY Fitted" },
  options: { elements: [{ id: { "7 1/4": "O_714", "7 3/8": "O_738", "7 1/2": "O_712" }[size], name: size }, { id: color === "Black" ? "O_BLK" : "O_NVY", name: color }] },
  categories: { elements: [{ id: "C1", name: "Fitted" }, { id: "C9", name: "Website" }] },
  tags: { elements: [{ id: "T1", name: "MLB" }] },
  itemStock: { quantity: qty },
});

export const ITEMS = [
  fitted("IT_B714", "7 1/4", "Black", 3),
  fitted("IT_B738", "7 3/8", "Black", 1),
  fitted("IT_B712", "7 1/2", "Black", 0),
  fitted("IT_N738", "7 3/8", "Navy/White", 5),
  {
    id: "IT_BEANIE",
    name: "HatWear Navy Cuffed Beanie",
    price: 2499,
    hidden: false,
    modifiedTime: now - 1000,
    categories: { elements: [{ id: "C2", name: "Beanies" }, { id: "C9", name: "Website" }] },
    itemStock: { quantity: 8 },
  },
  { id: "IT_EMB", name: "Embroidery - Front", price: 799, hidden: false, categories: { elements: [{ id: "C3", name: "Services" }, { id: "C9", name: "Website" }] } },
  { id: "IT_HIDDEN", name: "Old Snapback", price: 3000, hidden: true, categories: { elements: [{ id: "C9", name: "Website" }] } },
  { id: "IT_OFFLINE", name: "Store-only Trucker", price: 3000, hidden: false, categories: { elements: [{ id: "C4", name: "Trucker" }] } },
];

const TAX_RATE = 0.09; // 9% in the mock, applied by "Clover"

export function startMock(port) {
  const state = { orders: new Map(), deleted: [], pays: [], idempotency: new Map(), nextOrder: 1 };
  const send = (res, code, body) => {
    res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    const auth = req.headers.authorization;
    const p = url.pathname;

    // Fake iframe SDK: plain inputs instead of Clover's secure iframes.
    if (p === "/sdk.js") {
      res.writeHead(200, { "content-type": "application/javascript" });
      res.end(`
        window.Clover = function (key, opts) {
          if (!key || !opts || !opts.merchantId) throw new Error("bad init");
          const fields = {};
          return {
            elements() {
              return {
                create(type) {
                  return {
                    mount(sel) {
                      if (type === "PAYMENT_REQUEST_BUTTON") return;
                      const i = document.createElement("input");
                      i.setAttribute("data-clover-field", type);
                      i.style.cssText = "width:100%;height:100%;border:0;outline:0;font:inherit";
                      document.querySelector(sel).appendChild(i);
                      fields[type] = i;
                    },
                    addEventListener() {},
                  };
                },
              };
            },
            createToken() {
              const num = (fields.CARD_NUMBER && fields.CARD_NUMBER.value || "").replace(/\\s/g, "");
              if (num.length < 12) return Promise.resolve({ errors: { CARD_NUMBER: "Card number is invalid." } });
              return Promise.resolve({ token: num.startsWith("4000") ? "clv_decline_test" : "clv_test_ok_" + num.slice(-4) });
            },
          };
        };`);
      return;
    }

    if (p.startsWith("/v3/merchants/")) {
      if (auth !== `Bearer ${REST_TOKEN}`) return send(res, 401, { message: "Unauthorized" });
      const rest = p.replace(`/v3/merchants/${MID}`, "");
      if (req.method === "GET" && rest === "/items") {
        const offset = Number(url.searchParams.get("offset") || 0);
        return send(res, 200, { elements: offset ? [] : ITEMS });
      }
      if (req.method === "GET" && rest === "/attributes") return send(res, 200, { elements: url.searchParams.get("offset") > 0 ? [] : ATTRIBUTES });
      const item = rest.match(/^\/items\/([A-Z0-9_]+)$/);
      if (req.method === "GET" && item) {
        const it = ITEMS.find((i) => i.id === item[1]);
        return it ? send(res, 200, it) : send(res, 404, { message: "Not found" });
      }
      const totals = (cart) => {
        const subtotal = cart.lineItems.reduce(
          (n, li) => n + (ITEMS.find((i) => i.id === li.item.id)?.price ?? 0) + (li.discounts ?? []).reduce((d, x) => d + x.amount, 0),
          0,
        );
        const tax = Math.round(subtotal * TAX_RATE);
        return { subtotal, tax, total: subtotal + tax };
      };
      if (req.method === "POST" && rest === "/atomic_order/checkouts") {
        const t = totals(body.orderCart);
        return send(res, 200, { id: "CHK1", orderCart: body.orderCart, total: t.total, tax: t.tax });
      }
      if (req.method === "POST" && rest === "/atomic_order/orders") {
        const t = totals(body.orderCart);
        const id = `ORD${String(state.nextOrder++).padStart(4, "0")}`;
        state.orders.set(id, { id, total: t.total, cart: body.orderCart, status: "created" });
        return send(res, 200, { id, total: t.total });
      }
      const del = rest.match(/^\/orders\/([A-Z0-9]+)$/);
      if (req.method === "DELETE" && del) {
        state.deleted.push(del[1]);
        state.orders.delete(del[1]);
        return send(res, 200, {});
      }
      return send(res, 404, { message: `mock: no route ${req.method} ${rest}` });
    }

    const pay = p.match(/^\/v1\/orders\/([A-Z0-9]+)\/pay$/);
    if (pay && req.method === "POST") {
      if (auth !== `Bearer ${ECOMM_KEY}`) return send(res, 401, { error: { message: "Unauthorized" } });
      const key = req.headers["idempotency-key"];
      if (!key) return send(res, 400, { error: { message: "idempotency-key required" } });
      if (state.idempotency.has(key)) return send(res, 200, state.idempotency.get(key));
      const order = state.orders.get(pay[1]);
      if (!order) return send(res, 404, { error: { message: "order not found" } });
      state.pays.push({ orderId: pay[1], body, key, ip: req.headers["x-forwarded-for"] });
      if (body.source === "clv_decline_test") return send(res, 402, { error: { type: "card_error", code: "card_declined", message: "Card declined" } });
      const result = { id: order.id, object: "order", status: "paid", amount: order.total, amount_paid: order.total, source: { brand: "VISA", last4: "1111" } };
      order.status = "paid";
      state.idempotency.set(key, result);
      return send(res, 200, result);
    }
    send(res, 404, { message: "mock: not found" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ server, state })));
}
