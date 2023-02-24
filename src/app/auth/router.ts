import { Router } from 'express';
import AuthController from './controller';


const router = Router();
const authController = new AuthController();


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/refresh-token', authController.refreshToken);
router.get('/logout', authController.logout);

export default router;