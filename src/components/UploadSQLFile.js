import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import axios from 'axios';

const UploadSQLFile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dbName, setDbName] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleDatabaseNameChange = (event) => {
    setDbName(event.target.value);
  };

  const handleJsonFileUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const sqlContent = event.target.result;
        const jsonData = parseSqlToJson(sqlContent);
        const formattedJsonData = formatJsonWithCollectionName(jsonData);
        const blob = new Blob(
          [formattedJsonData.map((doc) => JSON.stringify(doc)).join('\n')],
          { type: 'application/json' }
        );
        saveAs(blob, 'data_with_collections.json');
      };
      reader.readAsText(selectedFile);
    } else {
      alert('No file selected!');
    }
  };

  const handleMongoFileUpload = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const sqlContent = event.target.result;
        const jsonData = parseSqlToJson(sqlContent);
        const mongoCommands = convertJsonToMongoCommands(jsonData);
        const blob = new Blob([mongoCommands], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'mongoCommands.mongo');
      };
      reader.readAsText(selectedFile);
    } else {
      alert('No file selected!');
    }
  };

  const handleAddToDatabase = () => {
    if (selectedFile && dbName) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const sqlContent = event.target.result;
        const jsonData = parseSqlToJson(sqlContent);

        console.log('Parsed JSON data:', jsonData);

        try {
          const response = await fetch('http://localhost:5000/add-to-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dbName,
              collectionsData: jsonData,
            }),
          });

          const result = await response.json();
          if (response.ok) {
            alert('Database created successfully and data inserted!');
          } else {
            console.error('Error creating database:', result.message);
            alert('Error creating database: ' + result.message);
          }
        } catch (error) {
          console.error('Fetch error:', error);
          alert('Error creating database: ' + error.message);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      alert('No file selected or database name missing!');
    }
  };
  const parseSqlToJson = (sqlContent) => {
    const lines = sqlContent.split('\n');
    const collections = {};
    const foreignKeys = {}; // Holds foreign key relations
    let currentTable = null;
    let columns = [];
    let insertStatement = '';
    let alterStatement = '';
  
    lines.forEach((line) => {
      const trimmedLine = line.trim();
  
      // Detect CREATE TABLE statements
      if (trimmedLine.toUpperCase().startsWith('CREATE TABLE')) {
        const tableNameMatch = trimmedLine.match(/CREATE TABLE [`\[]?(\w+)[`\]]?/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          currentTable = tableName;
          columns = [];
          collections[tableName] = [];
          foreignKeys[tableName] = []; // Initialize the foreign keys array for this table
        }
      }
  
      // Parse columns in CREATE TABLE
      if (currentTable && (trimmedLine.startsWith('`') || trimmedLine.startsWith('['))) {
        const columnNameMatch = trimmedLine.match(/[`\[]?(\w+)[`\]]?/);
        if (columnNameMatch) {
          const columnName = columnNameMatch[1];
          columns.push(columnName);
        }
      }
  
      // Parse foreign key relationships in CREATE TABLE
      if (currentTable && trimmedLine.toUpperCase().startsWith('FOREIGN KEY')) {
        const foreignKeyMatch = trimmedLine.match(/FOREIGN KEY \([`\[]?(\w+)[`\]]?\) REFERENCES [`\[]?(\w+)[`\]]?\([`\[]?(\w+)[`\]]?\)/i);
        if (foreignKeyMatch) {
          const foreignKey = {
            column: foreignKeyMatch[1],
            referencedTable: foreignKeyMatch[2],
            referencedColumn: foreignKeyMatch[3],
          };
          foreignKeys[currentTable].push(foreignKey);
        }
      }
  
      // Capture ALTER TABLE foreign key references
      if (trimmedLine.toUpperCase().startsWith('ALTER TABLE') || alterStatement) {
        alterStatement += ' ' + trimmedLine;
        if (trimmedLine.endsWith(';')) {
          const alterMatch = alterStatement.match(/ALTER TABLE [`\[]?(\w+)[`\]]? ADD CONSTRAINT [`\[]?(\w+)[`\]]? FOREIGN KEY \([`\[]?(\w+)[`\]]?\) REFERENCES [`\[]?(\w+)[`\]]?\([`\[]?(\w+)[`\]]?\)/i);
          if (alterMatch) {
            const tableName = alterMatch[1];
            const foreignKey = {
              column: alterMatch[3],
              referencedTable: alterMatch[4],
              referencedColumn: alterMatch[5],
            };
            if (!foreignKeys[tableName]) {
              foreignKeys[tableName] = [];
            }
            foreignKeys[tableName].push(foreignKey);
          }
          alterStatement = ''; // Reset after processing
        }
      }
  
      // Detect and process INSERT INTO statements
      if (trimmedLine.toUpperCase().startsWith('INSERT INTO') || insertStatement) {
        insertStatement += ' ' + trimmedLine;
        if (trimmedLine.endsWith(';')) {
          const tableNameMatch = insertStatement.match(/INSERT INTO [`\[]?(\w+)[`\]]?/i);
          const columnNamesMatch = insertStatement.match(/\((.*?)\)/);
          const valuesMatch = insertStatement.match(/VALUES\s*(.*);/i);
  
          if (tableNameMatch && columnNamesMatch && valuesMatch) {
            const tableName = tableNameMatch[1];
            const columnNames = columnNamesMatch[1].split(',').map((col) =>
              col.trim().replace(/[`]/g, '').replace(/\[/g, '').replace(/\]/g, '')
            );
            const valuesList = valuesMatch[1].split(/\),\s*\(/).map((valGroup) =>
              valGroup.replace(/[()]/g, '').split(',').map((val) => val.trim().replace(/'/g, ''))
            );
  
            valuesList.forEach((values) => {
              const rowData = {};
              columnNames.forEach((col, index) => {
                rowData[col] = values[index] !== undefined ? values[index] : null;
              });
              collections[tableName].push(rowData);
            });
          }
          insertStatement = '';
        }
      }
    });
  
    // Apply foreign key relationships after parsing
    Object.keys(foreignKeys).forEach((table) => {
      foreignKeys[table].forEach((fk) => {
        const { column, referencedTable, referencedColumn } = fk;
        if (collections[table]) {
          collections[table].forEach((row) => {
            let fkValue = row[column];
            if (fkValue) {
              const referencedDoc = collections[referencedTable]
                ? collections[referencedTable].find((doc) => doc[referencedColumn] === fkValue)
                : null;
  
              if (referencedDoc) {
                row[column] = { $ref: referencedTable, $id: fkValue }; // Use $ref for reference
              }
            }
          });
        }
      });
    });
  
    return collections;
  };
  
    
  

  const formatJsonWithCollectionName = (jsonData) => {
    const formattedData = [];
    for (const [tableName, rows] of Object.entries(jsonData)) {
      rows.forEach((row) => {
        formattedData.push({ _collection: tableName, ...row });
      });
    }
    return formattedData;
  };

  const convertJsonToMongoCommands = (jsonData) => {
    let mongoCommands = '';

    for (const [tableName, rows] of Object.entries(jsonData)) {
      mongoCommands += `db.createCollection("${tableName}");\n`;
      rows.forEach(row => {
        mongoCommands += `db.${tableName}.insert(${JSON.stringify(row)});\n`;
      });
    }

    return mongoCommands;
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files[0];
    setSelectedFile(file);
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Upload SQL File</h1>
      <div
        className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <p className="text-center">
          {selectedFile ? selectedFile.name : 'Drag and drop your SQL file here or click to select'}
        </p>
        
        {/* Input for file selection */}
        <input
          type="file"
          accept=".sql"
          onChange={handleFileChange}
          className="d-none"
          id="file-upload"
        />
        
        {/* Visible file selection button */}
        <label htmlFor="file-upload" className="btn btn-primary mt-3">
          Select SQL File
        </label>
      </div>
      <input
        type="text"
        className="form-control my-3"
        placeholder="Enter Database Name"
        value={dbName}
        onChange={handleDatabaseNameChange}
      />
      <div className="text-center">
        <button
          onClick={handleJsonFileUpload}
          className="btn btn-success btn-lg m-2"
        >
          Download JSON File
        </button>
        <button
          onClick={handleMongoFileUpload}
          className="btn btn-primary btn-lg m-2"
        >
          Convert to MongoDB Commands
        </button>
        <button
          onClick={handleAddToDatabase}
          className="btn btn-danger btn-lg m-2"
        >
          Add to MongoDB Database
        </button>
      </div>
      <footer className="mt-5 text-center">
        <p>
          Made with ❤️ by <strong>Daksh Khungla</strong><br />
          <a href="https://dakshkhungla.netlify.app/" target="_blank" rel="noopener noreferrer">
            Portfolio
          </a> | 
          <a href="https://github.com/Dakshkhungla" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default UploadSQLFile;