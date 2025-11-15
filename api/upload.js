import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
    }

  try {
    const keyID = "005c524b07de46b0000000001";
    const appKey = "005709e6468d65e403be3c7bf3f4bbbf88654416ad";
    const bucketId = "7cd592d42b40879d9ea4061b";
    const bucketName = "baly121";

    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ ok: false, error: "Missing fileName or fileType" });
    }

    const authToken = Buffer.from(`${keyID}:${appKey}`).toString("base64");

    const authRes = await axios.get(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      { headers: { Authorization: `Basic ${authToken}` } }
    );

    const apiUrl = authRes.data.apiUrl;
    const token = authRes.data.authorizationToken;

    const uploadRes = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId },
      { headers: { Authorization: token } }
    );

    const uploadUrl = uploadRes.data.uploadUrl;
    const uploadToken = uploadRes.data.authorizationToken;

    return res.json({
      ok: true,
      uploadUrl,
      uploadToken,
      fileName,
      downloadUrl: `https://f000.backblazeb2.com/file/${bucketName}/${fileName}`
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.toString() });
  }
}
