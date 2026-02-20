import { projectMember } from "../models/projectMemberRole.models.js";
import { ApiError } from "../utils/api-error.js";

export const requireProjectMember = async(req, res, next) => {
    // get project id from params
    const { projectId } = req.params;

    // finding the membership of user in the project
    const membership = await projectMember.findOne({user: req.user._id, project: projectId}).then((membership) => {

    })

    // if membership does not exist, throw error
    if (!membership) {
        return res.status(403).json(new ApiError(403, "You are not a member of this project"));
    }

    // if membership exists, attach it to request object and call next middleware
    req.membership = membership;
    next();// call next middleware


}