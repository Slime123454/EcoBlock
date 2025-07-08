import express from 'express';
import Product from '../models/Product.js';
import { UserActivity } from '../models/UserActivity.js';
import { requireModule } from '../utils/importer.js';
const { auth } = await requireModule('../middleware/auth.js', import.meta.url);

const router = express.Router();

// Validate product scan
router.post('/validate', auth, async (req, res) => {
  try {
    console.log('Received validation request:', req.body); // Debug log

    // Accept both 'id' and 'productId' from frontend
    const { id, productId, name, brand, points, imageUrl, image } = req.body;
    
    // Use either 'id' or 'productId' (frontend might send either)
    const actualProductId = productId || id;
    
    if (!actualProductId) {
      return res.status(400).json({
        valid: false,
        message: 'Product ID is required'
      });
    }

    // Find product in database
    const product = await Product.findOne({ 
      _id: actualProductId,
      name,
      brand,
      points
    });

    if (!product) {
      console.log('Product not found in DB. Searched for:', { 
        _id: actualProductId,
        name,
        brand,
        points
      });
      return res.status(404).json({ 
        valid: false,
        message: 'Product not found or attributes do not match' 
      });
    }

    // Rest of your existing code remains the same...
    const alreadyScanned = await UserActivity.findOne({
      userId: req.user._id,
      'details.productId': actualProductId
    });

    if (alreadyScanned) {
      return res.status(400).json({
        valid: false,
        message: 'This product has already been scanned by you'
      });
    }

    // Record the scan
    const activity = new UserActivity({
      userId: req.user._id,
      activityType: 'product_scan',
      details: {
        productId: actualProductId,
        name,
        brand,
        points,
        imageUrl: imageUrl || image || null, // Accept both imageUrl and image
        scannedAt: new Date()
      }
    });

    await activity.save();

    res.json({ 
      valid: true,
      message: 'Product validated successfully',
      scanRecord: {
        id: activity._id,
        productId: actualProductId,
        name,
        brand,
        points,
        date: activity.details.scannedAt,
        image: activity.details.imageUrl
      }
    });

  } catch (error) {
    console.error('Product validation error:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Server error during validation',
      error: error.message
    });
  }
});

export default router;