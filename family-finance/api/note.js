const { getAccessToken, httpsReq } = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  try {
    const token = await getAccessToken();
    const { spreadsheetId, sheetId, row, col, note } = req.body;

    const body = {
      requests: [{
        updateCells: {
          range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: col, endColumnIndex: col + 1 },
          rows: [{ values: [{ note }] }],
          fields: "note",
        }
      }]
    };

    const result = await httpsReq("sheets.googleapis.com",
      `/v4/spreadsheets/${spreadsheetId}:batchUpdate`, "POST", token, body);
    res.status(result.status).json(JSON.parse(result.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
