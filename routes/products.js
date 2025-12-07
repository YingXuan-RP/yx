const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Get all products
router.get('/api/products', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/api/products/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product with image upload
router.post('/api/products', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock, isAvailable, sku, tags } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ 
        error: 'Name, description, price, and category are required' 
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: stock ? parseInt(stock) : 0,
      isAvailable: isAvailable === 'true' || isAvailable === true,
      sku,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags) : [],
      imageUrl: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await product.save();
    await product.populate('category', 'name');
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/api/products/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, stock, isAvailable, sku, tags } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      product.category = category;
    }
    if (stock !== undefined) product.stock = parseInt(stock);
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (sku !== undefined) product.sku = sku;
    if (tags !== undefined) {
      product.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }
    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    await product.populate('category', 'name');
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/api/products/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Toggle product availability
router.patch('/api/products/:id/toggle-availability', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
});

module.exports = router;
