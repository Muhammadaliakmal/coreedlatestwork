import mongoose from "mongoose";
import { projectMember } from "../models/projectMemberRole.models.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Project Member Middleware
 * Verifies that the authenticated user is a member of the specified project
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    // Get project id from params
    const { projectId } = req.params;

    // Sanitize inputs
    const sanitizedProjectId = projectId?.trim();

    if (!sanitizedProjectId) {
      throw new ApiError(400, "Project ID is required");
    }

    // Validate project ID format
    if (!mongoose.Types.ObjectId.isValid(sanitizedProjectId)) {
      throw new ApiError(400, "Invalid project ID format");
    }

    // Validate user ID format
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format");
    }

    // Finding the membership of user in the project
    const membership = await projectMember.findOne({
      user: userId,
      project: sanitizedProjectId,
    });

    // If membership does not exist, throw error with debug info
    if (!membership) {
      console.log(
        `[DEBUG] User ${userId} is not a member of project ${sanitizedProjectId}`,
      );
      console.log(`[DEBUG] req.user:`, req.user);
      console.log(`[DEBUG] req.params:`, req.params);
      throw new ApiError(
        403,
        "You are not a member of this project. Please ensure you created the project or were added as a member.",
      );
    }

    // If membership exists, attach it to request object and call next middleware
    req.membership = membership;
    next(); // Call next middleware
  } catch (error) {
    next(error);
  }
};

/**
 * Project Admin Middleware
 * Verifies that the authenticated user has admin role in the project
 * Must be used after requireProjectMember middleware
 */
export const requireProjectAdmin = async (req, res, next) => {
  try {
    // If user is not a member of the project, we cannot check admin status
    if (!req.membership) {
      throw new ApiError(403, "You are not a member of this project");
    }

    // Check if the user has admin role
    if (
      req.membership.role !== "admin" &&
      req.membership.role !== "project_admin"
    ) {
      throw new ApiError(403, "Admin access required");
    }

    next(); // Call next middleware
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Project Member Middleware
 * Attaches membership if user is a member, but doesn't block if not
 * Useful for endpoints that show different data based on membership
 */
export const optionalProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const sanitizedProjectId = projectId?.trim();

    if (sanitizedProjectId && req.user?._id) {
      const userId = req.user._id;

      if (
        mongoose.Types.ObjectId.isValid(sanitizedProjectId) &&
        mongoose.Types.ObjectId.isValid(userId)
      ) {
        const membership = await projectMember.findOne({
          user: userId,
          project: sanitizedProjectId,
        });

        if (membership) {
          req.membership = membership;
        }
      }
    }

    next();
  } catch (error) {
    // Don't block the request, just continue without membership
    next();
  }
};
