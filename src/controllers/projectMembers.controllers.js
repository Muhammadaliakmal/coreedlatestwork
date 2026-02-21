import { asyncHandler } from "../utils/async-handler.js";
import { projectMember } from "../models/projectMemberRole.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { projectTable } from "../models/project.models.js";
import { UserTable } from "../models/user.models.js";

export const listProjectMember = asyncHandler(async (req, res) => {
  // get project id from params
  const { projectId } = req.params;

  // if project id is not provided, throw error
  if (!projectId) {
    return res.status(400).json(new ApiError(400, "Project ID is required"));
  }
  // find all members of the project for given project id
  const members = await projectMember
    .find({ project: projectId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  // return response to client
  res
    .status(200)
    .json(
      new ApiResponse(200, members, "Project members fetched successfully"),
    );
});

export const addProjectMember = asyncHandler(async (req, res) => {
  // get the project id from requests params
  const { projectId } = req.params;

  // if project id is not provided, throw error
  if (!projectId) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Project ID is required",
          "Please provide a valid project ID in the request parameters",
        ),
      );
  }

  // get the email, role and permission from request body
  const { email, role = "member", permission } = req.body;

  //verify project exits or not
  const project = await projectTable.findById(projectId);
  if (!project) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          "Project not found",
          "The project with the provided ID does not exist",
        ),
      );
  }

  // find user by email
  const user = await UserTable.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          "User not found",
          "The user with the provided email does not exist",
        ),
      );
  }

  // check if user is already a member of the project
  const existingMember = await projectMember.findOne({
    project: projectId,
    user: user._id,
  });
  if (existingMember) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "User is already a member of the project",
          "The user with the provided email is already a member of this project",
        ),
      );
  }

  // create new project member
  const newMember = await projectMember({
    project: projectId,
    user: user._id,
    role,
    invitedBy: req.user._id,
    permissions: {
      canCreateTasks: permission?.canCreateTasks ?? true,
      canEditTasks: permission?.canEditTasks ?? true,
      canDeleteTasks: permission?.canDeleteTasks ?? false,
      canManageMembers: permission?.canManageMembers ?? false,
      canViewReports: permission?.canViewReports ?? true,
    },
  });

  // update project metadata totalmembers++

  await projectTable.findByIdAndUpdate(projectId, {
    $inc: { "metadata.totalMembers": 1 },
    $set: { "metadata.lastActivity": new Date() },
  });

  const populatedMember = await projectMember
    .findById(newMember._id)
    .populate("user", "name email");

  // return response to client
  res
    .status(201)
    .json(new ApiResponse(201, newMember, "Project member added successfully"));
});
