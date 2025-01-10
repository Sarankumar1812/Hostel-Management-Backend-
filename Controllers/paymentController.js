import Booking from "../Models/bookingSchema.js";
import sendEmail from "../Utils/mailer.js";
import pdfkit from "pdfkit";
import fs from "fs";
import path from "path";
import Room from "../Models/roomSchema.js";
import Resident from "../Models/residentSchema.js";
import got from "got";

// PayPal API URLs
const PAYPAL_API = process.env.PAYPAL_API; // Use sandbox for testing
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET || !PAYPAL_API) {
  console.error("PayPal environment variables are not set!");
  process.exit(1);
}

// Generate PayPal access token
const getPayPalAccessToken = async () => {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  try {
    const response = await got.post(`${PAYPAL_API}/v1/oauth2/token`, {
      searchParams: {
        grant_type: "client_credentials",
      },
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      responseType: "json",
    });
  
    const newAccessToken = response.body.access_token;
    return newAccessToken;
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.response?.body || error.message
    );
    throw error;
  }
};

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    const orderResponse = await got.post(`${PAYPAL_API}/v2/checkout/orders`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      json: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: booking.priceBreakdown.totalPrice.toFixed(2) || 1000,
            },
            reference_id: booking.bookingReference,
          },
        ],
        application_context: {
          brand_name: "HM Hostel",
          locale: "en-US",
          return_url: "https://hostel-management-mern.netlify.app/payment-success",
          cancel_url: "https://hostel-management-mern.netlify.app/payment-failure",
        },
      },
      responseType: "json",
    });

    const orderId = orderResponse.body?.id;
 

    res.status(201).json({
      message: "PayPal order created successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error(
      "Error creating PayPal order:",
      error.response?.body || error.message
    );
    return res.status(500).json({
      error: "Internal Server Error.",
      details: error.response?.body || error.message,
    });
  }
};

// Capture PayPal Payment
export const capturePayPalPayment = async (req, res) => {
  try {
    const { orderID } = req.params;
    const { bookingId } = req.query;

    if (!orderID) {
      return res.status(400).json({ message: "Payment ID is required" });
    }
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get order details
    const captureResponse = await got.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        responseType: "json",
      }
    );

    // correctly extract and log the payment status
    const paymentData = captureResponse.body;
    const paymentStatus = paymentData.status;
  

    // Check the status of the payment
    if (paymentStatus !== "COMPLETED") {
      console.log("Payment was not successful. Redirecting to failure page...");
      return res.redirect("https://hostel-management-mern.netlify.app/payment-failure");
    }

    // Update booking details
    const booking = await Booking.findById(bookingId);
  
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.payment = {
      status: "paid",
      captureId: paymentData.id,
      amount: booking.priceBreakdown.totalPrice,
      currency: "USD",
    };
    booking.bookingStatus = "confirmed";
    await booking.save();

    const resident = await Resident.findById(booking.resident);
  
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    resident.status = "active";
    resident.room = booking.room;
    resident.checkInDate = booking.checkInDate;
    resident.checkOutDate = booking.checkOutDate;
    await resident.save();

    const room = await Room.findById(booking.room);
   
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Update room details
    const totalGuests =
      booking.guests.adults +
      booking.guests.children +
      booking.guests.infantsUnder2;
    room.bedRemaining -= totalGuests;
    if (room.residents.length < room.capacity) {
      room.residents.push(resident._id);
    }
    room.isAvailable = room.bedRemaining > 0;
    room.residents.push(resident._id);  
    room.status =
      room.residents.length < room.capacity ? "reserved" : "occupied";
    await room.save();



    if (!fs.existsSync("./receipts")) {
      fs.mkdirSync("./receipts");
    }
    // Generate and send PDF receipt asynchronously
    const pdfPath = path.resolve(`./receipts/${booking._id}.pdf`);

    try {
      generatePdfReceipt(booking, pdfPath);
    } catch (error) {
      console.error("PDF Generation Failed: ", error);
    }

    // Send email asynchronously after PDF generation
    const subject = `Payment Received - Booking ${booking.bookingReference}`;
    const html = `<h1>Payment Confirmation</h1><p>Booking Reference: ${booking.bookingReference}</p>`;
    const text = `Payment Confirmation\nBooking Reference: ${booking.bookingReference}`;
    const attachments = [
      { filename: `${booking._id}.pdf`, path: pdfPath },
    ];

    try {
      await sendEmail(resident.email, subject, html, text, attachments);
      console.log("Email Sent Successfully");
    } catch (error) {
      console.error("Email not sent:", error);
    } finally {
      fs.unlink(pdfPath, (err) => {
        if (err) console.error("Error deleting PDF:", err);
      });
    }

    res.status(200).json({
      message: "Payment successful, receipt sent via email",
      bookingStatus: booking.bookingStatus,
    });
  } catch (error) {
    res.redirect("https://hostel-management-mern.netlify.app/payment-failure");
    console.error(
      "PayPal payment capture error:",
      error.response?.data || error.message
    );
  }
};

// Refund PayPal Payment (Optional)
export const refundPayPalPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking || booking.payment.status !== "paid") {
      throw new Error("Cannot refund this booking");
    }

    const refundResponse = await got.post(
      `${PAYPAL_API}/v2/payments/captures/${booking.payment.captureId}/refund`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        json: {
          amount: { value: booking.payment.amount, currency_code: "USD" },
        },
        responseType: "json",
      }
    );

    booking.payment.status = "refunded";
    booking.bookingStatus = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Refund processed successfully",
      refundDetails: refundResponse.body,
    });
  } catch (error) {
    console.error("Refund error:", error.response?.body || error.message);
    res.status(500).json({ message: "Failed to process refund" });
  }
};

// PDF generation function
// PDF generation function
const generatePdfReceipt = (booking, pdfPath) => {
  try {
    const doc = new pdfkit();
    const outputStream = fs.createWriteStream(pdfPath);

    // Pipe the document to the file stream
    doc.pipe(outputStream);

    // Add PDF content
    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Booking Reference: ${booking.bookingReference}`)
      .text(`Name: ${booking.name}`)
      .text(`Email: ${booking.email}`)
      .text(`Payment Amount: $${booking.priceBreakdown.totalPrice.toFixed(2)}`)
      .text(`Payment Status: Paid`)
      .text(`Check-in Date: ${booking.checkInDate}`)
      .text(`Check-out Date: ${booking.checkOutDate}`)
      .text(`Room: ${booking.room}`);
    doc.moveDown();
    doc.text("Thank you for your payment!", { align: "center" });

    // Finalize the PDF
    doc.end();

    outputStream.on("finish", () => {
      console.log(`PDF receipt generated successfully: ${pdfPath}`);
    });

    outputStream.on("error", (err) => {
      console.error(`Error writing PDF receipt to file: ${err.message}`);
    });
  } catch (error) {
    // Handle unexpected errors gracefully
    console.error(`Error generating PDF receipt: ${error.message}`);
  }
};
