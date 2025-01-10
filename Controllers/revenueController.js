import Booking from "../Models/bookingSchema.js"; // Import the Booking model

// Revenue grouped by rent, maintenance charge, and tax, filtered by payment status and booking status
export const getRevenueByCategory = async (req, res) => {
  const { startDate, endDate } = req.query; // Get the date range from req.query
  /* Validate for date range */
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start and end dates are required" });
  }
  try {
    const revenueData = await Booking.aggregate([
      // Match only bookings where payment status is "paid" and booking status is "confirmed"
      {
        $match: {
          bookingStatus: "confirmed", // Ensure booking is confirmed
          "payment.status": "paid", // Ensure payment is done
          checkInDate: { $gte: new Date(startDate) }, // Filter by startDate
          checkOutDate: { $lte: new Date(endDate) }, // Filter by endDate
        },
      },
      // Project the price breakdown fields
      {
        $project: {
          rent: "$priceBreakdown.basePrice", // Rent amount
          maintenanceCharge: "$priceBreakdown.maintenanceCharge", // Maintenance charge
          tax: "$priceBreakdown.tax", // Tax amount
        },
      },
      // Group by summing up rent, maintenance charge, and tax
      {
        $group: {
          _id: null, // Grouping all data together
          totalRent: { $sum: "$rent" }, // Sum of all rents
          totalMaintenanceCharge: { $sum: "$maintenanceCharge" }, // Sum of all maintenance charges
          totalTax: { $sum: "$tax" }, // Sum of all taxes
        },
      },
      // Project the result to calculate total revenue
      {
        $project: {
          _id: 0, // Remove _id field
          totalRent: 1, // Include total rent
          totalMaintenanceCharge: 1, // Include total maintenance charge
          totalTax: 1, // Include total tax
          totalRevenue: {
            $add: ["$totalRent", "$totalMaintenanceCharge", "$totalTax"],
          }, // Calculate total revenue
        },
      },
    ]);


    // If revenue data is available, return it, else return an empty object
    return res.status(200).json({
      message: "Revenue grouped successfully",
      data: revenueData.length ? revenueData[0] : {}, // Ensure it is not an empty array
    });
  } catch (error) {
    console.error("Error aggregating revenue:", error.message);
    return res
      .status(500)
      .json({ message: "Error aggregating revenue", error: error.message });
  }
};
