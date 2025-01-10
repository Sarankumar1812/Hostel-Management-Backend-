import Expense from "../Models/expenseSchema.js";

export const createExpense = async (req, res) => {
  try {
    const { category, amount, details, date } = req.body;

    // Validation
    if (!category || typeof category !== "string" || category.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing category" });
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid or missing amount" });
    }

    if (!details || typeof details !== "string" || details.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing details" });
    }

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ message: "Invalid or missing date" });
    }

    // Create new expense
    const expense = new Expense({
      category: category.trim(),
      amount,
      details: details.trim(),
      date: new Date(date), // Ensure the date is stored as a valid Date object
    });

    await expense.save();

    res.status(200).json({
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Error creating expense" });
  }
};


/* Get expense by date range and group by category */
export const getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

   
    /* Validate for date range */
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }

    // Query to aggregate expenses by category
    const expenses = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: "$category", // Group by category
          totalAmount: { $sum: "$amount" }, // Sum up amounts
          count: { $sum: 1 }, // Count the number of expenses in each category
        },
      },
      {
        $sort: { totalAmount: -1 }, // Sort by totalAmount in descending order
      },
    ]);

    res.status(200).json({
      message: "Expenses grouped by category and fetched successfully",
      data: expenses,
    });
  } catch (error) {
    console.error("Error fetching expenses by category:", error);
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

/* Get expense by year group by Month */
export const getExpensesByYear = async (req, res) => {
  const { year } = req.query;  // Extract the year from the query
  if (!year) {
    return res.status(400).json({ message: 'Year is required' });
  };

  try {
    // Define the date range for the entire year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Grouping by month (year-month format)
    const groupStage = {
      $dateToString: { format: '%Y-%m', date: '$date' },  // Group by year-month
    };

    const expenseData = await Expense.aggregate([
      // Match expenses within the specified year range
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      // Project the necessary fields and the grouping field (date in year-month format)
      {
        $project: {
          amount: 1,
          category: 1,
          details: 1,
          dateGroup: groupStage, // Add the grouping by date (year-month)
        },
      },
      // Group by year-month and sum the expenses
      {
        $group: {
          _id: '$dateGroup',  // Group by the formatted date (year-month)
          totalAmount: { $sum: '$amount' },
          expenses: { $push: { category: '$category', amount: '$amount', details: '$details' } }, // Collect individual expenses in each group
        },
      },
      // Project the result to include total expenses and individual expense details
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalAmount: 1,
          expenses: 1,  // Show the list of expenses in the group
        },
      },
      {
        // Sort the results by date in ascending order (optional)
        $sort: { date: 1 },
      },
    ]);

    return res.status(200).json({
      message: 'Expenses grouped by date successfully',
      expenses: expenseData || [],
    });
  } catch (error) {
    console.error('Error aggregating expenses by date:', error.message);
    return res.status(500).json({ message: 'Error aggregating expenses by date', error: error.message });
  }
};

