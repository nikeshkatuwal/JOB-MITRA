import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "Please login to continue",
                success: false,
            });
        }

        try {
            const decoded = await jwt.verify(token, process.env.SECRET_KEY);
            if (!decoded) {
                return res.status(401).json({
                    message: "Invalid token",
                    success: false
                });
            }
            
            // Set the user ID for use in controllers
            req.id = decoded.userId;
            
            // Optionally fetch the full user object
            try {
                const user = await User.findById(decoded.userId);
                if (user) {
                    req.user = user;
                }
            } catch (userError) {
                console.warn("Failed to fetch user details:", userError.message);
                // Continue even if fetching user details fails
            }
            
            next();
        } catch (jwtError) {
            console.error("JWT verification error:", jwtError);
            return res.status(401).json({
                message: "Session expired. Please login again",
                success: false
            });
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Authentication failed",
            success: false
        });
    }
};

export default isAuthenticated;