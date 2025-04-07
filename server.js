const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/open-in-browser', (req, res) => {
  const { html, css } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  const tempFilePath = path.join(__dirname, 'temp.html');
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
      <style>
        ${css || ''}
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  fs.writeFileSync(tempFilePath, htmlContent);

  res.send('HTML file created successfully');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});