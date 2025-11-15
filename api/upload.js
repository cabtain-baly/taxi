// api/upload.js  (ESM)
import { Buffer } from "buffer";

export default async function handler(req, res) {
  // دعم CORS (مهم جداً عند الطلب من GitHub Pages أو أي دومين آخر)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Only POST allowed" });
    return;
  }

  try {
    // ضع المفاتيح في ENV بدل هذا في وقت لاحق
    const KEY_ID = process.env.B2_KEY_ID || "005c524b07de46b0000000001";
    const APP_KEY = process.env.B2_APP_KEY || "005709e6468d65e403be3c7bf3f4bbbf88654416ad";
    const bucketId = process.env.B2_BUCKET_ID || "7cd592d42b40879d9ea4061b";
    const bucketName = process.env.B2_BUCKET_NAME || "baly121";

    const { fileName, fileType } = req.body || {};
    if (!fileName || !fileType) {
      return res.status(400).json({ ok: false, error: "Missing fileName or fileType" });
    }

    // 1) authorize account
    const auth = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString("base64");
    const authResp = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      method: "GET",
      headers: { Authorization: `Basic ${auth}` }
    });
    if (!authResp.ok) {
      const t = await authResp.text();
      return res.status(500).json({ ok:false, error: "authorize failed", details: t });
    }
    const authJson = await authResp.json();
    const apiUrl = authJson.apiUrl;
    const accountAuthToken = authJson.authorizationToken;

    // 2) get upload URL for bucket
    const uploadUrlResp = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: "POST",
      headers: { Authorization: accountAuthToken, "Content-Type": "application/json" },
      body: JSON.stringify({ bucketId })
    });
    if (!uploadUrlResp.ok) {
      const t = await uploadUrlResp.text();
      return res.status(500).json({ ok:false, error: "get_upload_url failed", details: t });
    }
    const uploadJson = await uploadUrlResp.json();

    // 3) return upload info (encode file name to be safe)
    const safeFileName = encodeURIComponent(fileName);

    return res.json({
      ok: true,
      uploadUrl: uploadJson.uploadUrl,
      uploadToken: uploadJson.authorizationToken,
      fileName: safeFileName,
      downloadUrl: `https://f000.backblazeb2.com/file/${bucketName}/${safeFileName}`
    });

  } catch (err) {
    console.error("upload API error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
