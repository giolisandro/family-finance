// Shared Google auth — used by all /api functions
const https = require("https");
const crypto = require("crypto");

let tokenCache = { token: null, expires: 0 };

function base64url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function makeJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const signingInput = `${header}.${claim}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const sig = sign.sign(sa.private_key, "base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${sig}`;
}

function httpsPost(hostname, path, body, contentType) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method: "POST",
      headers: { "Content-Type": contentType, "Content-Length": Buffer.byteLength(body) }
    }, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpsReq(hostname, path, method, token, body) {
  return new Promise((resolve, reject) => {
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) headers["Content-Length"] = Buffer.byteLength(bodyStr);
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) return tokenCache.token;
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const jwt = makeJWT(sa);
  const body = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
  const data = await httpsPost("oauth2.googleapis.com", "/token", body, "application/x-www-form-urlencoded");
  const parsed = JSON.parse(data);
  if (parsed.error) throw new Error(`Auth error: ${parsed.error_description || parsed.error}`);
  tokenCache = { token: parsed.access_token, expires: Date.now() + (parsed.expires_in - 60) * 1000 };
  return tokenCache.token;
}

module.exports = { getAccessToken, httpsReq };
