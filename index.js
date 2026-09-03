const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs/promises');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);
const app = express();

app.use(cors());
app.use(express.json());

const FUNCTIONS_DIR = path.join(__dirname, 'functions');

// 1. DEPLOY ENDPOINT: User sends code and receives a URL
app.post('/deploy', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).send('Code is required');

    const id = crypto.randomUUID(); 
    const filePath = path.join(FUNCTIONS_DIR, `${id}.js`);

    try {
        await fs.writeFile(filePath, code);
        res.json({
            message: 'Function deployed successfully!',
            url: `http://localhost:3000/run/${id}`
        });
    } catch (err) {
        res.status(500).send('Failed to save function code.');
    }
});

// 2. EXECUTE ENDPOINT: Hits the URL and runs code in Docker sandbox
app.get('/run/:id', async (req, res) => {
    const { id } = req.params;
    const filePath = path.join(FUNCTIONS_DIR, `${id}.js`);

    try {
        await fs.access(filePath);

        // Docker Sandbox (isolation, no internet, memory/cpu limits)
        const dockerCmd = `docker run --rm --network none --memory="64m" --cpus="0.5" -v ${filePath}:/app/index.js node:18-alpine node /app/index.js`;

        const { stdout, stderr } = await execPromise(dockerCmd, { timeout: 5000 });

        res.send(stdout || stderr);

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).send('Function not found');
        }
        if (error.killed) {
            return res.status(408).send('Execution Timeout: Code took too long!');
        }
        res.status(500).send(`Execution error: ${error.message}`);
    }
});

// Start Server
app.listen(3000, async () => {
    await fs.mkdir(FUNCTIONS_DIR, { recursive: true });
    console.log('Mini-Lambda Backend is running on http://localhost:3000');
});
