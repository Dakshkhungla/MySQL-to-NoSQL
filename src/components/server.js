const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');  // Import CORS package
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Use CORS middleware to allow cross-origin requests
app.use(cors());

// Middleware
app.use(bodyParser.json());

// MongoDB connection URL
const url = 'mongodb://127.0.0.1:27017/'; // Explicitly use IPv4 address
const client = new MongoClient(url);

// Route to add data to a database
app.post('/add-to-database', async (req, res) => {
  const { dbName, collectionsData } = req.body;
  console.log('Received request to add data to database:', dbName);
  console.log('Collections data:', collectionsData);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const database = client.db(dbName); // Create or access the database
    
    // Iterate over the collection data and insert it
    for (const [tableName, rows] of Object.entries(collectionsData)) {
      if (rows.length > 0) { // Check if the array is not empty
        const collection = database.collection(tableName);
        console.log(`Inserting data into collection: ${tableName}`);
        await collection.insertMany(rows);
      } else {
        console.log(`Skipping empty collection: ${tableName}`);
      }
    }

    res.status(200).json({ message: 'Database created successfully and data inserted!' });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ message: 'Error creating database: ' + error.message });
  } finally {
    await client.close();
    console.log('Closed MongoDB connection');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
