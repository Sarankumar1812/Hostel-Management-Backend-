import Staff from "../Models/staffSchema.js";

export const getAvailableStaffs = async (req, res) => {
    try {
        const staffs = await Staff.find({isAvailable: true});
        res.status(200).json({ success: true, data: staffs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching available staffs" });
    }
}
