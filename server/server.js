const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.json({ error: 'No file uploaded' });

    const filePath = path.resolve(req.file.path);
    console.log('File received at:', filePath);

    exec(`powershell.exe -Command "ipfs add -Q ${filePath}"`, (err, stdout, stderr) => {
        if (err) return res.json({ error: stderr });

        const cid = stdout.trim();
        exec(`powershell.exe -Command "ipfs pin add ${cid}"`, (err2, stdout2, stderr2) => {
            if (err2) return res.json({ error: stderr2 });
            res.json({ cid, message: 'File added and pinned!' });
        });
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
