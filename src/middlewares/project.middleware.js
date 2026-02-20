import { projectMember } from "../models/projectMemberRole.models.js";
import { ApiError } from "../utils/api-error.js";

//  this middleware will check if the user is a member of the project
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

// this middleware will check if the user is an admin of the project
export const requireProjectAdmin = () => {
    // is user is also a member of the project, we can check if the user is an admin 
     if(!req.membership){
        throw new ApiError(403, "You are not a member of this project");
     }
     if(req.membership.role !== "admin"){
        throw new ApiError(403, "You are not an admin of this project");
     }

     next();// call next middleware
}