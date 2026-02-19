// routes/resources.js
const express = require('express');
const router = express.Router();
const {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getResourcesByCategory,
  toggleLike,
  addComment,
  getFeaturedResources,
  getWeatherUpdates
} = require('../controllers/resourceController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.route('/')
  .get(getAllResources)
  .post(protect, authorize('admin'), createResource);

router.route('/featured')
  .get(getFeaturedResources);

router.route('/weather')
  .get(getWeatherUpdates);

router.route('/category/:category')
  .get(getResourcesByCategory);

// Resource detail and admin-only modifications
router.route('/:id')
  .get(getResourceById)
  .put(protect, authorize('admin'), updateResource)
  .delete(protect, authorize('admin'), deleteResource);

// Interactions
router.route('/:id/like')
  .post(protect, toggleLike);

router.route('/:id/comment')
  .post(protect, addComment);

module.exports = router;