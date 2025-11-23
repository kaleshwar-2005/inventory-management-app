require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


const upload = multer({ dest: 'uploads/' });


app.get('/api/products', (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];

  if (category && category !== 'All') {
    sql += ' WHERE category = ?';
    params.push(category);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});


app.get('/api/products/search', (req, res) => {
  const { name } = req.query;
  if (!name) return res.json([]);

  const like = `%${name.toLowerCase()}%`;
  const sql = 'SELECT * FROM products WHERE lower(name) LIKE ?';

  db.all(sql, [like], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});


app.get('/api/products/:id/history', (req, res) => {
  const { id } = req.params;
  const sql =
    'SELECT * FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC';

  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  });
});


app.put(
  '/api/products/:id',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be an integer >= 0'),
    body('unit').notEmpty(),
    body('category').notEmpty(),
    body('brand').notEmpty(),
    body('status').notEmpty()
  ],
  (req, res) => {
    const { id } = req.params;
    const { name, unit, category, brand, stock, status, image, changedBy } =
      req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    
    db.get(
      'SELECT id FROM products WHERE lower(name) = lower(?) AND id != ?',
      [name, id],
      (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (row)
          return res
            .status(400)
            .json({ error: 'Product name must be unique' });

        
        db.get('SELECT * FROM products WHERE id = ?', [id], (err2, product) => {
          if (err2) return res.status(500).json({ error: 'DB error' });
          if (!product)
            return res.status(404).json({ error: 'Product not found' });

          const oldStock = product.stock;
          const newStock = parseInt(stock, 10);

          
          const sql = `
            UPDATE products
            SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?
            WHERE id = ?
          `;
          const params = [
            name,
            unit,
            category,
            brand,
            newStock,
            status,
            image || product.image,
            id
          ];

          db.run(sql, params, function (err3) {
            if (err3) return res.status(500).json({ error: 'DB error' });

            
            if (oldStock !== newStock) {
              const logSql = `
                INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy, timestamp)
                VALUES (?, ?, ?, ?, ?)
              `;
              const logParams = [
                id,
                oldStock,
                newStock,
                changedBy || 'admin',
                new Date().toISOString()
              ];
              db.run(logSql, logParams);
            }

           
            db.get(
              'SELECT * FROM products WHERE id = ?',
              [id],
              (err4, updated) => {
                if (err4)
                  return res.status(500).json({ error: 'DB error' });
                res.json(updated);
              }
            );
          });
        });
      }
    );
  }
);


app.post(
  '/api/products/import',
  upload.single('csvFile'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const results = [];
    let added = 0;
    let skipped = 0;
    const duplicates = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
     
        const processNext = (index) => {
          if (index >= results.length) {
            fs.unlinkSync(filePath); 
            return res.json({ added, skipped, duplicates });
          }

          const row = results[index];
          const {
            name,
            unit,
            category,
            brand,
            stock,
            status,
            image
          } = row;

          if (!name) {
            skipped++;
            return processNext(index + 1);
          }

          
          db.get(
            'SELECT id FROM products WHERE lower(name) = lower(?)',
            [name],
            (err, existing) => {
              if (err) {
                skipped++;
                return processNext(index + 1);
              }
              if (existing) {
                skipped++;
                duplicates.push({ name, existingId: existing.id });
                return processNext(index + 1);
              }

              
              const insertSql = `
                INSERT INTO products (name, unit, category, brand, stock, status, image)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;
              const stockVal = parseInt(stock || '0', 10);

              db.run(
                insertSql,
                [
                  name,
                  unit || '',
                  category || '',
                  brand || '',
                  isNaN(stockVal) ? 0 : stockVal,
                  status || (stockVal > 0 ? 'In Stock' : 'Out of Stock'),
                  image || ''
                ],
                (err2) => {
                  if (err2) {
                    skipped++;
                  } else {
                    added++;
                  }
                  processNext(index + 1);
                }
              );
            }
          );
        };

        processNext(0);
      });
  }
);


app.get('/api/products/export', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    const headers = [
      'name',
      'unit',
      'category',
      'brand',
      'stock',
      'status',
      'image'
    ];

    const csvLines = [headers.join(',')];

    rows.forEach((p) => {
      const line = [
        p.name,
        p.unit || '',
        p.category || '',
        p.brand || '',
        p.stock,
        p.status || '',
        p.image || ''
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
      csvLines.push(line);
    });

    const csvData = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="products.csv"'
    );
    res.status(200).send(csvData);
  });
});



app.post(
  '/api/products',
  [
    body('name').notEmpty(),
    body('stock').isInt({ min: 0 }),
    body('unit').notEmpty(),
    body('category').notEmpty(),
    body('brand').notEmpty(),
    body('status').notEmpty()
  ],
  (req, res) => {
    const { name, unit, category, brand, stock, status, image } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    db.get(
      'SELECT id FROM products WHERE lower(name) = lower(?)',
      [name],
      (err, row) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (row)
          return res
            .status(400)
            .json({ error: 'Product name must be unique' });

        const sql = `
          INSERT INTO products (name, unit, category, brand, stock, status, image)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(
          sql,
          [name, unit, category, brand, stock, status, image || ''],
          function (err2) {
            if (err2) return res.status(500).json({ error: 'DB error' });

            db.get(
              'SELECT * FROM products WHERE id = ?',
              [this.lastID],
              (err3, newProduct) => {
                if (err3)
                  return res.status(500).json({ error: 'DB error' });
                res.status(201).json(newProduct);
              }
            );
          }
        );
      }
    );
  }
);

app.get('/', (req, res) => {
  res.send('Inventory backend running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
