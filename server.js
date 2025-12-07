const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));
// Helpers to normalize DB rows to API shapes
const mapCategoryRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  icon: row.icon,
  is_active: !!row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
  _id: row.id,
  isActive: !!row.is_active,
  createdAt: row.created_at,
});

const mapProductRow = (row) => {
  const hasCategoryJoin = row.category_id_ref !== undefined;
  const category = hasCategoryJoin && row.category_id_ref
    ? {
        id: row.category_id_ref,
        name: row.category_name,
        description: row.category_description,
        icon: row.category_icon,
        is_active: !!row.category_is_active,
        created_at: row.category_created_at,
        _id: row.category_id_ref,
        isActive: !!row.category_is_active,
        createdAt: row.category_created_at,
      }
    : null;

  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    category_id: row.category_id,
    image_url: row.image_url,
    stock: row.stock,
    is_available: !!row.is_available,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category,
  };
};

const mapDiscountRow = (row) => ({
  id: row.id,
  code: row.code,
  type: row.type,
  value: Number(row.value),
  usageLimit: row.usage_limit,
  used: row.used,
  category: row.category,
  description: row.description,
  minimumPurchase: Number(row.minimum_purchase),
  validUntil: row.valid_until,
  isActive: !!row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const fetchOrdersWithDetails = async (orders) => {
  if (!orders.length) return [];

  const orderIds = orders.map((order) => order.id);
  const placeholders = orderIds.map(() => '?').join(',');
  const [items] = await db.query(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
    orderIds,
  );

  const itemsByOrder = items.reduce((acc, item) => {
    acc[item.order_id] = acc[item.order_id] || [];
    acc[item.order_id].push({
      ...item,
      price: Number(item.price),
    });
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    total_amount: Number(order.total_amount),
    user: order.user_id
      ? {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
          role: order.user_role,
        }
      : null,
    items: itemsByOrder[order.id] || [],
  }));
};

// API Routes
// Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, icon, is_active, created_at, updated_at FROM categories ORDER BY id ASC',
    );
    res.json(rows.map(mapCategoryRow));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, description, icon, is_active, created_at, updated_at FROM categories WHERE id = ?',
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(mapCategoryRow(rows[0]));
  } catch (error) {
    console.error('Failed to fetch category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, description, icon, isActive } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name],
    );
    if (existing.length) {
      return res.status(400).json({ success: false, error: `Category "${name}" already exists. Please use a different name.` });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name, description, icon, is_active) VALUES (?, ?, ?, ?)',
      [name.trim(), description || '', icon || '📦', toBoolean(isActive, true)],
    );

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    const category = mapCategoryRow(rows[0]);
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  const { name, description, icon, isActive } = req.body;

  try {
    const [existingRows] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!existingRows.length) return res.status(404).json({ error: 'Category not found' });
    const existingCategory = existingRows[0];

    if (name && name !== existingCategory.name) {
      const [dup] = await db.query(
        'SELECT id FROM categories WHERE id <> ? AND LOWER(name) = LOWER(?) LIMIT 1',
        [categoryId, name],
      );
      if (dup.length) {
        return res.status(400).json({ success: false, error: `Category "${name}" already exists. Please use a different name.` });
      }
    }

    const updatedName = name !== undefined ? name : existingCategory.name;
    const updatedDescription = description !== undefined ? description : existingCategory.description;
    const updatedIcon = icon !== undefined ? icon : existingCategory.icon;
    const updatedIsActive = toBoolean(isActive, existingCategory.is_active);

    await db.query(
      'UPDATE categories SET name = ?, description = ?, icon = ?, is_active = ? WHERE id = ?',
      [updatedName, updatedDescription, updatedIcon, updatedIsActive, categoryId],
    );

    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    res.json({ success: true, category: mapCategoryRow(rows[0]) });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);

  try {
    const [productCountRows] = await db.query(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
      [categoryId],
    );

    if (productCountRows[0].count > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete category. It has products associated with it.' });
    }

    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Category not found' });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.id ASC`,
    );
    res.json(rows.map(mapProductRow));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(mapProductRow(rows[0]));
  } catch (error) {
    console.error('Failed to fetch product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, description, price, category, stock, isAvailable } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Product name is required and cannot be empty.' });
  }

  if (price === undefined || price === null || price === '' || isNaN(price)) {
    return res.status(400).json({ success: false, error: 'Valid price is required. Please enter a numeric value.' });
  }

  if (!category) {
    return res.status(400).json({ success: false, error: 'Please select a category for this product.' });
  }

  const parsedPrice = parseFloat(price);
  const parsedStock = stock ? parseInt(stock, 10) : 0;

  if (parsedPrice < 0) {
    return res.status(400).json({ success: false, error: 'Price cannot be negative. Please enter a valid positive price.' });
  }

  if (parsedStock < 0) {
    return res.status(400).json({ success: false, error: 'Stock quantity cannot be negative. Please enter a valid positive quantity.' });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name],
    );
    if (existing.length) {
      return res.status(400).json({ success: false, error: `Product "${name}" already exists. Please use a different name.` });
    }

    const [categoryRows] = await db.query('SELECT id FROM categories WHERE id = ?', [category]);
    if (!categoryRows.length) {
      return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
    }

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category_id, image_url, stock, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name.trim(),
        description || '',
        parsedPrice,
        parseInt(category, 10),
        req.file ? `/uploads/${req.file.filename}` : '',
        parsedStock,
        toBoolean(isAvailable, true),
      ],
    );

    const [rows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [result.insertId],
    );

    res.status(201).json({ success: true, product: mapProductRow(rows[0]) });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const { name, description, price, category, stock, isAvailable } = req.body;

  try {
    const [existingRows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existingRows.length) return res.status(404).json({ error: 'Product not found' });
    const existingProduct = existingRows[0];

    if (name && name !== existingProduct.name) {
      const [dup] = await db.query(
        'SELECT id FROM products WHERE id <> ? AND LOWER(name) = LOWER(?) LIMIT 1',
        [productId, name],
      );
      if (dup.length) {
        return res.status(400).json({ success: false, error: `Product "${name}" already exists. Please use a different name.` });
      }
    }

    let parsedPrice;
    if (price !== undefined && price !== '') {
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ success: false, error: 'Invalid price format. Please enter a valid number.' });
      }
      if (parsedPrice < 0) {
        return res.status(400).json({ success: false, error: 'Price cannot be negative. Please enter a valid positive price.' });
      }
    }

    let parsedStock;
    if (stock !== undefined && stock !== '') {
      parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock)) {
        return res.status(400).json({ success: false, error: 'Invalid stock quantity. Please enter a valid number.' });
      }
      if (parsedStock < 0) {
        return res.status(400).json({ success: false, error: 'Stock quantity cannot be negative. Please enter a valid positive quantity.' });
      }
    }

    if (category) {
      const [categoryRows] = await db.query('SELECT id FROM categories WHERE id = ?', [category]);
      if (!categoryRows.length) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
      }
    }

    const updatedName = name !== undefined ? name : existingProduct.name;
    const updatedDescription = description !== undefined ? description : existingProduct.description;
    const updatedPrice = parsedPrice !== undefined ? parsedPrice : existingProduct.price;
    const updatedCategoryId = category !== undefined ? parseInt(category, 10) : existingProduct.category_id;
    const updatedStock = parsedStock !== undefined ? parsedStock : existingProduct.stock;
    const updatedAvailability = toBoolean(isAvailable, existingProduct.is_available);

    await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, is_available = ? WHERE id = ?',
      [
        updatedName,
        updatedDescription,
        updatedPrice,
        updatedCategoryId,
        updatedStock,
        updatedAvailability,
        productId,
      ],
    );

    const [rows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId],
    );

    res.json({ success: true, product: mapProductRow(rows[0]) });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.patch('/api/products/:id/toggle-availability', async (req, res) => {
  const productId = parseInt(req.params.id, 10);

  try {
    const [result] = await db.query(
      'UPDATE products SET is_available = NOT is_available WHERE id = ?',
      [productId],
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });

    const [rows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId],
    );

    res.json({ success: true, product: mapProductRow(rows[0]) });
  } catch (error) {
    console.error('Failed to toggle availability:', error);
    res.status(500).json({ error: 'Failed to toggle product availability' });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id ASC',
    );
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`,
    );

    const ordersWithDetails = await fetchOrdersWithDetails(orders);
    res.json(ordersWithDetails);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [req.params.id],
    );

    if (!orders.length) return res.status(404).json({ error: 'Order not found' });

    const [orderWithDetails] = await fetchOrdersWithDetails(orders);
    res.json(orderWithDetails);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.get('/api/order-items', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM order_items');
    const formatted = items.map((item) => ({ ...item, price: Number(item.price) }));
    res.json(formatted);
  } catch (error) {
    console.error('Failed to fetch order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
});

// Discounts API
app.get('/api/discounts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM discounts ORDER BY id ASC');
    res.json(rows.map(mapDiscountRow));
  } catch (error) {
    console.error('Failed to fetch discounts:', error);
    res.status(500).json({ error: 'Failed to fetch discounts' });
  }
});

app.get('/api/discounts/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM discounts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Discount not found' });
    res.json(mapDiscountRow(rows[0]));
  } catch (error) {
    console.error('Failed to fetch discount:', error);
    res.status(500).json({ error: 'Failed to fetch discount' });
  }
});

app.post('/api/discounts', async (req, res) => {
  const { code, type, value, usageLimit, validUntil, category, minimumPurchase, description, isActive } = req.body;

  if (!code || !type || value === undefined || value === null || !validUntil) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM discounts WHERE code = ? LIMIT 1', [code]);
    if (existing.length) {
      return res.status(400).json({ success: false, error: `Discount code "${code}" already exists` });
    }

    const [result] = await db.query(
      `INSERT INTO discounts (code, type, value, usage_limit, used, category, description, minimum_purchase, valid_until, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        code,
        type,
        parseFloat(value),
        parseInt(usageLimit, 10) || 0,
        0,
        category || '',
        description || '',
        parseFloat(minimumPurchase) || 0,
        validUntil,
        toBoolean(isActive, true),
      ],
    );

    const [rows] = await db.query('SELECT * FROM discounts WHERE id = ?', [result.insertId]);
    res.json({ success: true, discount: mapDiscountRow(rows[0]) });
  } catch (error) {
    console.error('Failed to create discount:', error);
    res.status(500).json({ success: false, error: 'Failed to create discount' });
  }
});

app.put('/api/discounts/:id', async (req, res) => {
  const { code, type, value, usageLimit, validUntil, category, minimumPurchase, description, isActive } = req.body;
  const discountId = parseInt(req.params.id, 10);

  try {
    const [existingRows] = await db.query('SELECT * FROM discounts WHERE id = ?', [discountId]);
    if (!existingRows.length) return res.status(404).json({ error: 'Discount not found' });
    const existing = existingRows[0];

    if (code && code !== existing.code) {
      const [dup] = await db.query('SELECT id FROM discounts WHERE code = ? AND id <> ? LIMIT 1', [code, discountId]);
      if (dup.length) {
        return res.status(400).json({ success: false, error: `Discount code "${code}" already exists` });
      }
    }

    const updatedCode = code !== undefined ? code : existing.code;
    const updatedType = type !== undefined ? type : existing.type;
    const updatedValue = value !== undefined && value !== '' ? parseFloat(value) : existing.value;
    const updatedUsageLimit = usageLimit !== undefined && usageLimit !== ''
      ? parseInt(usageLimit, 10)
      : existing.usage_limit;
    const updatedValidUntil = validUntil !== undefined ? validUntil : existing.valid_until;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedMinimumPurchase = minimumPurchase !== undefined && minimumPurchase !== ''
      ? parseFloat(minimumPurchase)
      : existing.minimum_purchase;
    const updatedDescription = description !== undefined ? description : existing.description;
    const updatedIsActive = toBoolean(isActive, !!existing.is_active);

    await db.query(
      `UPDATE discounts
       SET code = ?, type = ?, value = ?, usage_limit = ?, valid_until = ?, category = ?, minimum_purchase = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [
        updatedCode,
        updatedType,
        updatedValue,
        updatedUsageLimit,
        updatedValidUntil,
        updatedCategory,
        updatedMinimumPurchase,
        updatedDescription,
        updatedIsActive,
        discountId,
      ],
    );

    const [rows] = await db.query('SELECT * FROM discounts WHERE id = ?', [discountId]);
    res.json({ success: true, discount: mapDiscountRow(rows[0]) });
  } catch (error) {
    console.error('Failed to update discount:', error);
    res.status(500).json({ success: false, error: 'Failed to update discount' });
  }
});

app.delete('/api/discounts/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM discounts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Discount not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete discount:', error);
    res.status(500).json({ error: 'Failed to delete discount' });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });

    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [req.params.id],
    );
    const [orderWithDetails] = await fetchOrdersWithDetails(orders);
    res.json({ success: true, order: orderWithDetails });
  } catch (error) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Dashboard API
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const [summaryRows, availableProductsRows, activeUserRows, orderStatusRows, revenueRows] = await Promise.all([
      db.query(
        'SELECT (SELECT COUNT(*) FROM categories) AS totalCategories, (SELECT COUNT(*) FROM products) AS totalProducts, (SELECT COUNT(*) FROM users) AS totalUsers, (SELECT COUNT(*) FROM orders) AS totalOrders',
      ),
      db.query('SELECT COUNT(*) AS availableProducts FROM products WHERE is_available = TRUE'),
      db.query("SELECT COUNT(*) AS activeUsers FROM users WHERE role = 'user'"),
      db.query(
        `SELECT
           SUM(status = 'pending') AS pendingOrders,
           SUM(status = 'processing') AS processingOrders,
           SUM(status = 'delivered') AS deliveredOrders
         FROM orders`,
      ),
      db.query(
        "SELECT SUM(total_amount) AS totalRevenue FROM orders WHERE status IN ('delivered', 'processing', 'shipped')",
      ),
    ]);

    const summaryCounts = summaryRows[0][0];
    const availableProducts = availableProductsRows[0][0].availableProducts || 0;
    const activeUsers = activeUserRows[0][0].activeUsers || 0;
    const statusCounts = orderStatusRows[0][0];
    const totalRevenue = Number(revenueRows[0][0].totalRevenue || 0);

    const [recentOrdersRows] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`,
    );
    const recentOrders = await fetchOrdersWithDetails(recentOrdersRows);

    const [lowStockRows] = await db.query(
      `SELECT p.*, c.id AS category_id_ref, c.name AS category_name, c.description AS category_description, c.icon AS category_icon,
              c.is_active AS category_is_active, c.created_at AS category_created_at
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock < 10
       ORDER BY p.stock ASC
       LIMIT 5`,
    );
    const lowStockProducts = lowStockRows.map(mapProductRow);

    res.json({
      summary: {
        totalCategories: summaryCounts.totalCategories,
        totalProducts: summaryCounts.totalProducts,
        availableProducts,
        totalUsers: summaryCounts.totalUsers,
        activeUsers,
        totalOrders: summaryCounts.totalOrders,
        pendingOrders: Number(statusCounts.pendingOrders || 0),
        processingOrders: Number(statusCounts.processingOrders || 0),
        deliveredOrders: Number(statusCounts.deliveredOrders || 0),
        totalRevenue,
      },
      recentOrders,
      lowStockProducts,
      ordersByStatus: [],
      revenueTrend: [],
    });
  } catch (error) {
    console.error('Failed to fetch dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Public pages (no authentication required)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'categories.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/liveview', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'liveview.html'));
});

app.get('/discounts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'discounts.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory.html'));
});

app.get('/purchase-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'purchase-orders.html'));
});

app.get('/abandoned-checkouts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'abandoned-checkouts.html'));
});

app.get('/segments', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'segments.html'));
});

// Database health check
app.get('/api/db-health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS ok');
    res.json({ ok: true, rows });
  } catch (error) {
    console.error('DB health check failed:', error.message);
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 TeleBot Admin Portal running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`\n💡 Use an existing admin account to login:`);
  console.log(`   Email: boss@happybuy.com or admins@gmail.com\n`);
});

module.exports = app;
