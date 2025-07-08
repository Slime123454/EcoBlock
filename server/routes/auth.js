import express from 'express';
import { register, login, getUser, linkWallet } from '../controllers/authController.js';
import { requireModule } from '../utils/importer.js';
const { auth } = await requireModule('../middleware/auth.js', import.meta.url);

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', getUser);
router.post('/link-wallet', linkWallet);

// Export as default
export default router;