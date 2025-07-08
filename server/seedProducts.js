import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const products = [
  {
    _id: 'demo-product-123',
    name: 'Organic Cotton T-Shirt',
    brand: 'EcoWear',
    points: 30,
    barcode: '123456789012',
    imageUrl: 'assets/images/tshirt.jpg'
  },
  {
    _id: 'eco-bottle-456',
    name: 'Reusable Water Bottle',
    brand: 'HydroFlask',
    points: 50,
    barcode: '987654321098',
    imageUrl: 'assets/images/bottle.jpg'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    await Product.insertMany(products);
    console.log('Seeded database with initial products');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();