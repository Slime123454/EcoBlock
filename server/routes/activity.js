import express from 'express';
import { UserActivity } from '../models/UserActivity.js';
import { requireModule } from '../utils/importer.js';
const { auth } = await requireModule('../middleware/auth.js', import.meta.url);

const router = express.Router();

// POST /api/activity/recycle
router.post('/recycle', auth, async (req, res) => {
  try {
    console.log('Recycle request body:', req.body);
    const { material, weight, pointsEarned } = req.body;

    if (!material || !weight || !pointsEarned) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    const activity = new UserActivity({
      userId: req.user._id,
      activityType: 'recycle',
      details: { material, weight, pointsEarned }
    });

    await activity.save();
    
    res.status(201).json({
      success: true,
      message: 'Recycling recorded successfully',
      data: activity
    });

  } catch (error) {
    console.error('Recycle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});


router.get('/scan-history', auth, async (req, res) => {
  try {
    const history = await UserActivity.find({
      userId: req.user._id,
      activityType: 'product_scan'
    })
    .sort({ 'details.scannedAt': -1 })
    .limit(20);

    res.json(history.map(item => ({
      id: item._id,
      productId: item.details.productId,
      name: item.details.name,
      brand: item.details.brand,
      points: item.details.points,
      date: item.details.scannedAt,
      image: item.details.imageUrl
    })));

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to load scan history' });
  }
});

export default router;