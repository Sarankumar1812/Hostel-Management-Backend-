import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 50000,
    });
    console.log("Database connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
