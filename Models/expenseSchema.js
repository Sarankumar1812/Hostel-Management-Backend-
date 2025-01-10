import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({

    date: { type: Date, required: true, default: Date.now() },
    category: {
        type: String,
        required: true
    },
    amount: {type: Number, required: true},
    details: {type: String}
},
{timestamps: true}
)

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;