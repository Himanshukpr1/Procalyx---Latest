/**
 * Waits for a JSON API response that includes an "otp" field (QA may expose it in the body).
 * Registers the listener before triggering the action that causes the request (e.g. email Continue).
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<string>}
 */
function waitForOtpInResponse(page, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 60_000;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      page.off("response", onResponse);
      reject(new Error(`Timeout (${timeoutMs}ms) waiting for JSON response containing "otp"`));
    }, timeoutMs);

    /**
     * @param {unknown} obj
     * @returns {string | null}
     */
    function findOtp(obj) {
      if (obj == null || typeof obj !== "object") return null;
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const v = findOtp(item);
          if (v) return v;
        }
        return null;
      }
      if ("otp" in obj && (typeof obj.otp === "string" || typeof obj.otp === "number")) {
        return String(obj.otp);
      }
      for (const k of Object.keys(obj)) {
        const v = findOtp(/** @type {Record<string, unknown>} */ (obj)[k]);
        if (v) return v;
      }
      return null;
    }

    /**
     * @param {import('@playwright/test').Response} response
     */
    async function onResponse(response) {
      try {
        const ct = (response.headers()["content-type"] || "").toLowerCase();
        if (!ct.includes("json")) return;
        const text = await response.text();
        if (!/"otp"\s*:/.test(text)) return;
        let otp = null;
        try {
          otp = findOtp(JSON.parse(text));
        } catch {
          const m = text.match(/"otp"\s*:\s*"([^"]+)"/);
          if (m) otp = m[1];
        }
        if (otp && /^\d{4,8}$/.test(otp)) {
          clearTimeout(timer);
          page.off("response", onResponse);
          resolve(otp);
        }
      } catch {
        /* ignore parse/body errors */
      }
    }

    page.on("response", onResponse);
  });
}

module.exports = { waitForOtpInResponse };
