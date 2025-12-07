const express = require('express');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Get dashboard analytics
router.get('/api/dashboard/analytics', isAuthenticated, async (req, res) => {
  try {
    // Get counts
    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ isAvailable: true });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    
    // Get order statistics
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'processing', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .limit(5);

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const revenueTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['delivered', 'processing', 'shipped'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: {
        totalCategories,
        totalProducts,
        availableProducts,
        totalUsers,
        activeUsers,
        totalOrders,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalRevenue
      },
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      revenueTrend
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
