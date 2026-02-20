import {asyncHandler} from "../utils/async-handler.js";
import {projectMember} from "../models/projectMemberRole.models.js";
import {ApiResponse} from "../utils/api-response.js";
import {ApiError} from "../utils/api-error.js";
export const listProjectMember = asyncHandler(async (req, res) => {
  // get project id from params
  const { projectId } = req.params;

  // if project id is not provided, throw error
  if (!projectId) {
    return res.status(400).json(new
        ApiError(400, "Project ID is required")
    
    );
  }
    // find all members of the project for given project id
  const members=await projectMember.find({ project: projectId })
  .populate("user", "name email")
  .sort({ createdAt: -1 });

    // return response to client
    res.status(200).json(new ApiResponse(200,members , "Project members fetched successfully"));
})


export const addProjectMember = asyncHandler(async (req, res) => {
  //
})
