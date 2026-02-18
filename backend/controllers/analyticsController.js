const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user analytics (for farmer/buyer)
// @route   GET /api/analytics/user
// @access  Private
const getUserAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole === 'farmer') {
    // Farmer analytics
    const [products, transactions, messages] = await Promise.all([
      Product.countDocuments({ seller: userId }),
      Transaction.find({
        seller: userId
      }).populate('buyer', 'firstName lastName'),
      Message.countDocuments({
        $or: [
          { sender: userId },
          { receiver: userId }
        ]
      })
    ]);

    // Calculate sales metrics
    let totalSales = 0;
    let totalEarnings = 0;
    let monthlySales = {};
    
    transactions.forEach(transaction => {
      if (transaction.paymentStatus === 'completed') {
        totalSales += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
        totalEarnings += transaction.totalAmount;
        
        // Group by month for chart data
        const month = new Date(transaction.createdAt).toISOString().slice(0, 7);
        if (!monthlySales[month]) {
          monthlySales[month] = { sales: 0, earnings: 0 };
        }
        monthlySales[month].sales += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
        monthlySales[month].earnings += transaction.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        productsCount: products,
        totalSales,
        totalEarnings,
        totalMessages: messages,
        monthlySales: Object.entries(monthlySales).map(([month, data]) => ({
          month,
          sales: data.sales,
          earnings: data.earnings
        })),
        recentTransactions: transactions.slice(0, 5)
      }
    });
  } else if (userRole === 'buyer') {
    // Buyer analytics
    const transactions = await Transaction.find({
      buyer: userId
    }).populate('seller', 'firstName lastName farmName');

    // Calculate purchase metrics
    let totalPurchases = 0;
    let totalSpent = 0;
    let monthlyPurchases = {};
    
    transactions.forEach(transaction => {
      if (transaction.paymentStatus === 'completed') {
        totalPurchases += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
        totalSpent += transaction.totalAmount;
        
        // Group by month for chart data
        const month = new Date(transaction.createdAt).toISOString().slice(0, 7);
        if (!monthlyPurchases[month]) {
          monthlyPurchases[month] = { purchases: 0, spent: 0 };
        }
        monthlyPurchases[month].purchases += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
        monthlyPurchases[month].spent += transaction.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalPurchases,
        totalSpent,
        transactionCount: transactions.length,
        monthlyPurchases: Object.entries(monthlyPurchases).map(([month, data]) => ({
          month,
          purchases: data.purchases,
          spent: data.spent
        })),
        recentTransactions: transactions.slice(0, 5)
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Analytics not available for this role'
    });
  }
});

// @desc    Get admin analytics
// @route   GET /api/analytics/admin
// @access  Private/Admin
const getAdminAnalytics = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    totalFarmers,
    totalBuyers,
    totalProducts,
    totalTransactions,
    totalMessages,
    recentTransactions
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'buyer' }),
    Product.countDocuments(),
    Transaction.countDocuments(),
    Message.countDocuments(),
    Transaction.find()
      .populate('buyer seller', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Calculate revenue metrics
  let totalRevenue = 0;
  let monthlyRevenue = {};
  
  const allTransactions = await Transaction.find({ paymentStatus: 'completed' });
  allTransactions.forEach(transaction => {
    totalRevenue += transaction.totalAmount;
    
    // Group by month for chart data
    const month = new Date(transaction.createdAt).toISOString().slice(0, 7);
    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = 0;
    }
    monthlyRevenue[month] += transaction.totalAmount;
  });

  // Calculate user growth
  let userGrowth = {};
  const users = await User.find().sort({ createdAt: 1 });
  users.forEach(user => {
    const month = new Date(user.createdAt).toISOString().slice(0, 7);
    if (!userGrowth[month]) {
      userGrowth[month] = 0;
    }
    userGrowth[month]++;
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalProducts,
      totalTransactions,
      totalMessages,
      totalRevenue,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
      })),
      userGrowth: Object.entries(userGrowth).map(([month, count]) => ({
        month,
        count
      })),
      recentTransactions
    }
  });
});

// @desc    Get product analytics
// @route   GET /api/analytics/products
// @access  Private
const getProductAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole !== 'farmer') {
    return res.status(400).json({
      success: false,
      message: 'Product analytics only available for farmers'
    });
  }

  const products = await Product.find({ seller: userId });
  
  // Calculate product performance
  const productPerformance = products.map(product => ({
    _id: product._id,
    name: product.name,
    category: product.category,
    totalSold: product.soldCount,
    revenue: product.soldCount * product.basePrice,
    views: product.views,
    rating: product.ratings.average
  }));

  // Get top performing products
  const topProducts = [...productPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Get category distribution
  const categoryDistribution = {};
  products.forEach(product => {
    if (!categoryDistribution[product.category]) {
      categoryDistribution[product.category] = { count: 0, revenue: 0 };
    }
    categoryDistribution[product.category].count++;
    categoryDistribution[product.category].revenue += product.soldCount * product.basePrice;
  });

  res.status(200).json({
    success: true,
    data: {
      totalProducts: products.length,
      productPerformance,
      topProducts,
      categoryDistribution
    }
  });
});

module.exports = {  getUserAnalytics, 
  getAdminAnalytics,
  getProductAnalytics
}