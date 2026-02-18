const asyncHandler = require('../utils/asyncHandler');
const Resource = require('../models/Resource');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
const getAllResources = asyncHandler(async (req, res, next) => {
  const pageSize = 10;
  const page = parseInt(req.query.page) || 1;
  const { category, search } = req.query;

  let query = { isPublic: true };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const total = await Resource.countDocuments(query);
  const resources = await Resource.find(query)
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200).json({
    success: true,
    count: resources.length,
    page,
    pages: Math.ceil(total / pageSize),
    data: resources
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
const getResourceById = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id)
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture');

  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  // Increment view count
  resource.views = resource.views ? resource.views + 1 : 1;
  await resource.save();

  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private/Admin
const createResource = asyncHandler(async (req, res, next) => {
  const { title, content, category, tags, resourceType, media } = req.body;

  const resource = await Resource.create({
    title,
    content,
    category,
    tags: tags || [],
    resourceType: resourceType || 'article',
    media: media || [],
    author: req.user.id,
    authorName: `${req.user.firstName} ${req.user.lastName}`
  });

  res.status(201).json({
    success: true,
    data: resource
  });
});

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
const updateResource = asyncHandler(async (req, res, next) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
const deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  await resource.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get resources by category
// @route   GET /api/resources/category/:category
// @access  Public
const getResourcesByCategory = asyncHandler(async (req, res, next) => {
  const resources = await Resource.find({
    category: req.params.category,
    isPublic: true
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Toggle like on a resource
// @route   POST /api/resources/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  const userIndex = resource.likes.findIndex(
    like => like.user.toString() === req.user.id.toString()
  );

  if (userIndex > -1) {
    // Unlike
    resource.likes.splice(userIndex, 1);
  } else {
    // Like
    resource.likes.push({ user: req.user.id });
  }

  await resource.save();

  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc    Add comment to a resource
// @route   POST /api/resources/:id/comment
// @access  Private
const addComment = asyncHandler(async (req, res, next) => {
  const { comment } = req.body;

  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }

  resource.comments.unshift({
    user: req.user.id,
    comment
  });

  await resource.save();

  // Populate the user who commented
  const populatedResource = await Resource.findById(resource._id)
    .populate('author', 'firstName lastName profilePicture')
    .populate('comments.user', 'firstName lastName profilePicture');

  res.status(200).json({
    success: true,
    data: populatedResource
  });
});

// @desc    Get featured resources
// @route   GET /api/resources/featured
// @access  Public
const getFeaturedResources = asyncHandler(async (req, res, next) => {
  const resources = await Resource.find({
    isPublic: true,
    isFeatured: true
  })
    .populate('author', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Get weather updates
// @route   GET /api/resources/weather
// @access  Public
const getWeatherUpdates = asyncHandler(async (req, res, next) => {
  // In a real implementation, this would connect to a weather API
  // For now, we'll return sample weather data for Cameroon
  
  const weatherData = {
    location: 'Cameroon',
    forecast: [
      {
        date: new Date(),
        condition: 'Partly Cloudy',
        temperature: '28°C',
        humidity: '75%',
        precipitation: '10%'
      },
      {
        date: new Date(Date.now() + 86400000),
        condition: 'Sunny',
        temperature: '32°C',
        humidity: '65%',
        precipitation: '5%'
      },
      {
        date: new Date(Date.now() + 172800000),
        condition: 'Rainy',
        temperature: '26°C',
        humidity: '85%',
        precipitation: '80%'
      }
    ],
    advisory: 'Good conditions for planting maize and beans. Avoid field work during expected rainfall.'
  };

  res.status(200).json({
    success: true,
    data: weatherData
  });
});

module.exports = { getAllResources, 
  getResourceById, 
  createResource, 
  updateResource, 
  deleteResource,
  getResourcesByCategory,
  toggleLike,
  addComment,
  getFeaturedResources,
  getWeatherUpdates} 
