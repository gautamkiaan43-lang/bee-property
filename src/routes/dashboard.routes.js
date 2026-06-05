const express = require('express');
const router = express.Router();
const { getStats, getPerformanceData, getKPIs } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
router.get('/stats', protect, getStats);

// @route   GET /api/dashboard/performance
router.get('/performance', protect, getPerformanceData);

// @route   GET /api/dashboard/kpis
router.get('/kpis', protect, getKPIs);

module.exports = router;
