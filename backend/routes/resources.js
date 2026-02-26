// routes/resources.js
const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { ensureOwnerOrAdmin } = require('../middleware/ownership');
const resourceController = require('../controllers/resourceController');
const validators = require('../validators/resourceValidators');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

// Public
router.get('/', validators.pagination, handleValidation, resourceController.getAllResources);
router.get('/featured', resourceController.getFeaturedResources);
router.get('/weather', resourceController.getWeatherUpdates);
router.get('/:id', resourceController.getResourceById);
router.get('/category/:category', resourceController.getResourcesByCategory);

// Protected
router.post('/', protect, validators.createResource, handleValidation, resourceController.createResource);
router.put('/:id', protect, validators.updateResource, handleValidation, resourceController.updateResource);
router.delete('/:id', protect, ensureOwnerOrAdmin((req) => req.params.id), resourceController.deleteResource);

router.post('/:id/like', protect, resourceController.toggleLike);
router.post('/:id/comment', protect, validators.commentValidator, handleValidation, resourceController.addComment);

module.exports = router;
