const fs = require('fs');
const path = require('path');

const promptsDir = path.join(__dirname, 'prompts');
const outputFilePath = path.join(__dirname, 'src', 'prompts.json');

const prompts = {};

fs.readdirSync(promptsDir).forEach(file => {
  const key = path.basename(file, '.txt');
  const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
  prompts[key] = content.trim();
});

fs.writeFileSync(outputFilePath, JSON.stringify(prompts, null, 2));
console.log('Prompts generated:', prompts);