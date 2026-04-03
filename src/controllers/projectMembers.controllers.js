import { asyncHandler } from "../utils/async-handler.js";
import { projectMember } from "../models/projectMemberRole.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { projectTable } from "../models/project.models.js";
import { userTable } from "../models/user.models.js";

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
  const user = await userTable.findOne({ email: email.toLowerCase().trim() });
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

export const updateProjectMember = asyncHandler(async (req, res) => {
  // get the project id from requests params
  const { projectId, userId } = req.params;

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

  //  get the role and permission from request body
  const { role, permission } = req.body;

  // verify project exits or not
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

  // find project member by project id and user id
  const member = await projectMember.findOne({
    project: projectId,
    user: userId,
  });
  if (!member) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          "Project member not found",
          "The project member with the provided project ID and user ID does not exist",
        ),
      );
  }

  // only allow admin to update role and permissions of other members
  if (req.membership.role !== "admin") {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "Forbidden",
          "Only project admins can update the role and permissions of other members",
        ),
      );
  }

  //prevent removing the last admin from the project (basic safety check)
  if (member.role === "admin" && project.metadata.totalMembers === 1) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Forbidden",
          "Cannot remove the last admin from the project, this project must have at least one admin",
        ),
      );
  }

  // update project member role and permissions
  member.role = role ?? member.role;
  member.permissions = {
    canCreateTasks:
      permission?.canCreateTasks ?? member.permissions.canCreateTasks,
    canEditTasks: permission?.canEditTasks ?? member.permissions.canEditTasks,
    canDeleteTasks:
      permission?.canDeleteTasks ?? member.permissions.canDeleteTasks,
    canManageMembers:
      permission?.canManageMembers ?? member.permissions.canManageMembers,
    canViewReports:
      permission?.canViewReports ?? member.permissions.canViewReports,
  };
  await member.save();

  // populate user details in the response
  await member.populate("user", "name email");

  // return response to client
  res
    .status(200)
    .json(new ApiResponse(200, member, "Project member updated successfully"));
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  // get the project id from requests params
  const { projectId, userId } = req.params;

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

  // verify project exits or not
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

  // find project member by project id and user id
  const member = await projectMember.findOne({
    project: projectId,
    user: userId,
  });
  if (!member) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          "Project member not found",
          "The project member with the provided project ID and user ID does not exist",
        ),
      );
  }

  //prevent removing the last admin from the project (basic safety check)
  if (member.role === "admin" && project.metadata.totalMembers === 1) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Forbidden",
          "Cannot remove the last admin from the project, this project must have at least one admin",
        ),
      );
  }
  // remove project member
  await member.deleteOne();


  // update project metadata totalmembers--

  await projectTable.findByIdAndUpdate(projectId, {
    $inc: { "metadata.totalMembers": -1 },
    $set: { "metadata.lastActivity": new Date() },
  });

  // return response to client
  res
    .status(200)
    .json(new ApiResponse(200, null, "Project member removed successfully"));
});
