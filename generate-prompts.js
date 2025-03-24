const fs = require('fs');
const path = require('path');

const promptsDir = path.join(__dirname, 'prompts');
const outputFilePath = path.join(__dirname, 'src', 'prompts.json');

// Create directories if they don't exist
if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
}

if (!fs.existsSync(path.dirname(outputFilePath))) {
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
}

const prompts = {};

// Read all .txt files from the prompts directory
fs.readdirSync(promptsDir)
    .filter(file => file.endsWith('.txt'))
    .forEach(file => {
        const key = path.basename(file, '.txt')
            .toLowerCase()
            .replace(/-/g, '_');
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
        prompts[key] = content.trim();
    });

// Write the prompts to the output file
fs.writeFileSync(outputFilePath, JSON.stringify(prompts, null, 2));
console.log('Generated prompts:', Object.keys(prompts));