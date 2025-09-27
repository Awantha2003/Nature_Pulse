const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});
