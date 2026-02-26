// controllers/resourceController.js
const asyncHandler = require('../utils/asyncHandler');
const Resource = require('../models/Resource');
const ErrorResponse = require('../utils/errorResponse');
const pick = require('../utils/pick');
// inside controllers/resourceController.js
const { fetchWeather } = require('../server/utils/weather'); // implement this utility to call Open-Meteo API

// GET /api/resources
const getAllResources = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '10', 10));
  const skip = (page - 1) * limit;
  const { category, q } = req.query;

  const query = { isPublic: true, isArchived: { $ne: true } };
  if (category && category !== 'all') query.category = category;
  if (q) query.$text = { $search: q };

  const [total, resources] = await Promise.all([
    Resource.countDocuments(query),
    Resource.find(query)
      .populate('author', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    count: resources.length,
    data: resources
  });
});

// GET /api/resources/:id
const getResourceById = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture');

  if (!resource || resource.isArchived) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  // Atomic increment
  await Resource.findByIdAndUpdate(resource._id, { $inc: { views: 1 } }).exec();

  const updated = await Resource.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture');

  res.status(200).json({ success: true, data: updated });
});

// POST /api/resources
const createResource = asyncHandler(async (req, res, next) => {
  const allowed = ['title', 'content', 'category', 'tags', 'resourceType', 'media', 'isPublic', 'isFeatured', 'publishedAt'];
  const payload = pick(req.body, allowed);
  payload.author = req.user.id;
  payload.authorName = payload.authorName || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

  const resource = await Resource.create(payload);
  res.status(201).json({ success: true, data: resource });
});

// PUT /api/resources/:id
const updateResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.isArchived) return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));

  if (req.user.role !== 'admin' && resource.author.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this resource', 403));
  }

  const allowed = ['title', 'content', 'category', 'tags', 'resourceType', 'media', 'isPublic', 'isFeatured', 'publishedAt'];
  const updates = pick(req.body, allowed);

  Object.assign(resource, updates);
  await resource.save();

  res.status(200).json({ success: true, data: resource });
});

// DELETE /api/resources/:id (soft delete)
const deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));

  if (req.user.role !== 'admin' && resource.author.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this resource', 403));
  }

  resource.isArchived = true;
  await resource.save();

  res.status(200).json({ success: true, data: {} });
});

// GET /api/resources/category/:category
const getResourcesByCategory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const skip = (page - 1) * limit;

  const query = { category: req.params.category, isPublic: true, isArchived: { $ne: true } };
  const [total, resources] = await Promise.all([
    Resource.countDocuments(query),
    Resource.find(query).populate('author', 'firstName lastName profilePicture').sort({ createdAt: -1 }).skip(skip).limit(limit)
  ]);

  res.status(200).json({ success: true, page, limit, total, count: resources.length, data: resources });
});

// POST /api/resources/:id/like
const toggleLike = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.isArchived) return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));

  if (typeof resource.toggleLike === 'function') {
    const likeCount = await resource.toggleLike(req.user.id);
    const updated = await Resource.findById(req.params.id).populate('author', 'firstName lastName profilePicture');
    return res.status(200).json({ success: true, likes: likeCount, data: updated });
  }

  const uid = req.user.id;
  const idx = resource.likes.findIndex(id => id.toString() === uid.toString());
  if (idx === -1) resource.likes.push(uid);
  else resource.likes.splice(idx, 1);
  await resource.save();

  res.status(200).json({ success: true, data: resource });
});

// POST /api/resources/:id/comment
const addComment = asyncHandler(async (req, res, next) => {
  const { comment } = req.body;
  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return next(new ErrorResponse('Comment is required', 400));
  }

  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.isArchived) return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));

  resource.comments.unshift({ user: req.user.id, comment: comment.trim() });
  await resource.save();

  const populated = await Resource.findById(resource._id).populate('author', 'firstName lastName profilePicture').populate('comments.user', 'firstName lastName profilePicture');
  res.status(200).json({ success: true, data: populated });
});

// GET /api/resources/featured
const getFeaturedResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find({ isPublic: true, isFeatured: true, isArchived: { $ne: true } })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json({ success: true, count: resources.length, data: resources });
});



// GET /api/resources/weather
const getWeatherUpdates = asyncHandler(async (req, res, next) => {
  try {
    const lat = req.query.lat || '4.5';   // default lat for Cameroon (adjust as needed)
    const lon = req.query.lon || '12.5';  // default lon for Cameroon
    const data = await fetchWeather(lat, lon, { hourly: 'temperature_2m,precipitation', daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum' });

    // Map Open-Meteo response into a compact shape your frontend expects
    const forecast = {
      location: { lat, lon },
      hourly: data.hourly || {},
      daily: data.daily || {},
      meta: { generationtime_ms: data.generationtime_ms }
    };

    res.status(200).json({ success: true, data: forecast });
  } catch (err) {
    next(new ErrorResponse(err.message || 'Failed to fetch weather', 502));
  }
});

module.exports = {
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
};