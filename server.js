const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(express.json());

// مسیر فایل JSON
const DATA_FILE = path.join(__dirname, 'resume-data.json');

// Helper functions
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    throw error;
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/resume', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/resume/:section', async (req, res) => {
  try {
    const data = await readData();
    const section = req.params.section;
    
    if (!data[section]) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    res.json(data[section]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/resume', async (req, res) => {
  try {
    const currentData = await readData();
    const newData = req.body;
    
    if (!newData || Object.keys(newData).length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    const updatedData = { ...currentData, ...newData };
    await saveData(updatedData);
    
    res.json({ success: true, message: 'Data added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/resume', async (req, res) => {
  try {
    const newData = req.body;
    
    if (!newData.personal_info || !newData.skills) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    await saveData(newData);
    res.json({ success: true, message: 'Data replaced successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/resume', async (req, res) => {
  try {
    const currentData = await readData();
    const updates = req.body;
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
          target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };
    
    const updatedData = deepMerge(currentData, updates);
    await saveData(updatedData);
    
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/resume/:section', async (req, res) => {
  try {
    const section = req.params.section;
    const currentData = await readData();
    
    if (!currentData[section]) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    delete currentData[section];
    await saveData(currentData);
    
    res.json({ success: true, message: `Section '${section}' deleted` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});