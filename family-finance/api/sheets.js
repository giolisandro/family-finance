const { getAccessToken, httpsReq } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try {
    const token = await getAccessToken();
    const { spreadsheetId, range } = req.query;
    if (!spreadsheetId || !range) throw new Error("Missing spreadsheetId or range");

    if (req.method === "PUT") {
      const apiPath = `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
      const result = await httpsReq("sheets.googleapis.com", apiPath, "PUT", token, req.body);
      res.status(result.status).json(JSON.parse(result.body));
    } else {
      const apiPath = `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const result = await httpsReq("sheets.googleapis.com", apiPath, "GET", token, null);
      res.status(result.status).json(JSON.parse(result.body));
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
