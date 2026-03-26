module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({ ok: true, sa: !!process.env.GOOGLE_SERVICE_ACCOUNT });
};
