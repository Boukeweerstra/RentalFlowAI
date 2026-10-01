// Nep-diensten om de beveiliging lokaal te testen, zonder echte accounts of berichten:
//  - "Make" op poort 4000: controleert de header x-make-apikey en telt de ontvangen aanvragen.
//  - "Upstash Redis (REST)" op poort 4001: INCR, EXPIRE, DECR, SET NX EX en DEL met vervaltijden.
// Besturing (voor tests):  POST :4000/__mode?fail=1|0   GET :4000/__count
//                          POST :4001/__fail?on=1|0     GET :4001/__keys?prefix=cap:
//
// Gebruik:  node scripts/mock-services.mjs
import http from "node:http";

const MAKE_KEY = process.env.MOCK_MAKE_KEY ?? "test-secret";
const UPSTASH_TOKEN = process.env.MOCK_UPSTASH_TOKEN ?? "tok";

// --- Make ---------------------------------------------------------------
let makeFail = false;
let makeCount = 0;
const makeReceived = [];
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/__mode") {
      makeFail = url.searchParams.get("fail") === "1";
      return res.end(String(makeFail));
    }
    if (url.pathname === "/__count") return res.end(String(makeCount));
    if (url.pathname === "/__received") {
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(makeReceived));
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.headers["x-make-apikey"] !== MAKE_KEY) return res.writeHead(401).end("Unauthorized.");
      if (makeFail) return res.writeHead(500).end("boom");
      makeCount += 1;
      try {
        makeReceived.push(JSON.parse(body).flat);
      } catch {}
      res.writeHead(200).end("Accepted");
    });
  })
  .listen(4000, () => console.log("mock Make op :4000"));

// --- Upstash ------------------------------------------------------------
const store = new Map(); // key -> { val, exp }
let upstashFail = false;
const live = (k) => {
  const e = store.get(k);
  if (e && e.exp <= Date.now()) {
    store.delete(k);
    return undefined;
  }
  return e;
};

function run(cmd) {
  const [name, key, ...rest] = cmd;
  switch (String(name).toUpperCase()) {
    case "INCR": {
      const e = live(key) ?? { val: 0, exp: Infinity };
      e.val = Number(e.val) + 1;
      store.set(key, e);
      return e.val;
    }
    case "DECR": {
      const e = live(key) ?? { val: 0, exp: Infinity };
      e.val = Number(e.val) - 1;
      store.set(key, e);
      return e.val;
    }
    case "EXPIRE": {
      const e = live(key);
      if (!e) return 0;
      e.exp = Date.now() + Number(rest[0]) * 1000;
      return 1;
    }
    case "SET": {
      const nx = rest.map(String).includes("NX");
      const exIdx = rest.map(String).indexOf("EX");
      if (nx && live(key)) return null;
      store.set(key, { val: rest[0], exp: exIdx >= 0 ? Date.now() + Number(rest[exIdx + 1]) * 1000 : Infinity });
      return "OK";
    }
    case "DEL":
      return store.delete(key) ? 1 : 0;
    default:
      throw new Error(`onbekend commando ${name}`);
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/__fail") {
      upstashFail = url.searchParams.get("on") === "1";
      return res.end(String(upstashFail));
    }
    if (url.pathname === "/__keys") {
      const prefix = url.searchParams.get("prefix") ?? "";
      const out = {};
      for (const k of store.keys()) if (k.startsWith(prefix) && live(k)) out[k] = live(k).val;
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(out));
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.headers.authorization !== `Bearer ${UPSTASH_TOKEN}`) return res.writeHead(401).end("{}");
      if (upstashFail) return res.writeHead(500).end("{}");
      try {
        const cmds = JSON.parse(body);
        const out = cmds.map((c) => ({ result: run(c) }));
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(400).end(JSON.stringify([{ error: String(e) }]));
      }
    });
  })
  .listen(4001, () => console.log("mock Upstash op :4001"));
