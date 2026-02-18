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
const { protect, admin, farmer, buyer } = require('../middleware/auth');

// Public routes
router.route('/')
  .get(getAllResources)
  .post(protect, admin, createResource);

router.route('/featured')
  .get(getFeaturedResources);

router.route('/weather')
  .get(getWeatherUpdates);

router.route('/category/:category')
  .get(getResourcesByCategory);

router.route('/:id')
  .get(getResourceById)
  .put(protect, admin, updateResource)
  .delete(protect, admin, deleteResource);

router.route('/:id/like')
  .post(protect, toggleLike);

router.route('/:id/comment')
  .post(protect, addComment);

module.exports = router;