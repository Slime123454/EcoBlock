// server/models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  _id: {
    type: String, // Changed from ObjectId to String
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  barcode: {
    type: String,
    unique: true
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;