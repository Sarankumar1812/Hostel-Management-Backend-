// controllers/downloadController.js
import Expense from '../Models/expenseSchema.js';
import Booking from '../Models/bookingSchema.js';
import createPdf from '../Utils/createPdf.js';  // Utility for creating PDF

// Helper function to calculate Revenue
const calculateRevenue = async (startDate, endDate) => {
  try {
    const revenue = await Booking.aggregate([
      {
        $match: {
          "bookingStatus": "confirmed",  // Only consider confirmed bookings
          "payment.status": "paid",  // Only count paid bookings
          checkInDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $project: {
          basePrice: "$priceBreakdown.basePrice",  // Extract base price
          tax: "$priceBreakdown.tax",  // Extract tax
          maintenanceCharge: "$priceBreakdown.maintenanceCharge",  // Extract maintenance charge
          totalPrice: "$priceBreakdown.totalPrice",  // Extract total price
        },
      },
      {
        $group: {
          _id: null,  // Group all the documents together
          totalBasePriceRevenue: { $sum: "$basePrice" },
          totalTaxRevenue: { $sum: "$tax" },
          totalMaintenanceChargeRevenue: { $sum: "$maintenanceCharge" },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    // Return the result in a readable format
    const result = revenue.length > 0 ? revenue[0] : {
      totalBasePriceRevenue: 0,
      totalTaxRevenue: 0,
      totalMaintenanceChargeRevenue: 0,
      totalRevenue: 0,
    };

    return {
      totalBasePriceRevenue: result.totalBasePriceRevenue,
      totalTaxRevenue: result.totalTaxRevenue,
      totalMaintenanceChargeRevenue: result.totalMaintenanceChargeRevenue,
      totalRevenue: result.totalRevenue,
    };
  } catch (error) {
    console.error("Error calculating revenue:", error);
    return {
      totalBasePriceRevenue: 0,
      totalTaxRevenue: 0,
      totalMaintenanceChargeRevenue: 0,
      totalRevenue: 0,
    };
  }
};


// Download Expense Report
export const downloadExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch expenses based on date range
    const expenses = await Expense.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Generate styled PDF for the expense report
    const pdfBuffer = await createPdf('expense', expenses);

    // Set headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="expense-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading the expense report', error });
  }
};

// Download Revenue Report
export const downloadRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Calculate revenue
    const revenue = await calculateRevenue(startDate, endDate);

    // Generate styled PDF for revenue report
    const pdfBuffer = await createPdf('revenue', [{ revenue }]); // Pass the revenue object here, not a string

    // Set headers for downloading the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading the revenue report', error });
  }
};
