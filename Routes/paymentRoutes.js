import express from 'express';
import { 
  createPayPalOrder, 
  capturePayPalPayment, 
  refundPayPalPayment 
} from '../Controllers/paymentController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-order', authMiddleware, createPayPalOrder);
router.get('/capture-payment/:orderID', authMiddleware, capturePayPalPayment);
router.post('/refund-payment', authMiddleware, refundPayPalPayment);


export default router;