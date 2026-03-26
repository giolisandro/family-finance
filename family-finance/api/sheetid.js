const { getAccessToken, httpsReq } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try {
    const token = await getAccessToken();
    const { spreadsheetId, name } = req.query;
    const result = await httpsReq("sheets.googleapis.com",
      `/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, "GET", token, null);
    const data = JSON.parse(result.body);
    const sheet = (data.sheets || []).find(s => s.properties.title === name);
    if (!sheet) throw new Error(`Sheet "${name}" not found`);
    res.json({ sheetId: sheet.properties.sheetId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
