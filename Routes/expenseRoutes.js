import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { createExpense, getExpensesByCategory, getExpensesByYear } from '../Controllers/expenseController.js';


const router = express.Router();

router.post('/create', authMiddleware, roleMiddleware(['admin']), createExpense);
router.get('/category', authMiddleware, roleMiddleware(['admin']), getExpensesByCategory);
router.get('/expense-by-year', authMiddleware, roleMiddleware(['admin']), getExpensesByYear);

export default router;