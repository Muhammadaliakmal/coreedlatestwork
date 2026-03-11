// src\routes\projectMembers.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { listProjectMember,addProjectMember,updateProjectMember,removeProjectMember } from "../controllers/projectMembers.controllers.js";
import { requireProjectMember ,requireProjectAdmin} from "../middlewares/project.middleware.js";
const router = express.Router();

// Middleware
router.use(verifyJWT);//  you are login

// /api/projects/:projectId/members


// API routes
router.route("/:projectId/members").all(requireProjectMember).get(listProjectMember);// this will list all the members of a project

router.route("/:projectId/members").all(requireProjectMember).post(requireProjectAdmin,addProjectMember);// this will add a member to a project


router.route("/:projectId/members/:userId").all(requireProjectMember).put(requireProjectAdmin,updateProjectMember)//update a project member's role (e.g., promote to admin or demote to member)

router.route("/:projectId/members/:userId").all(requireProjectMember).delete(requireProjectAdmin,removeProjectMember) // remove a member from a project (only for admins)

export default router;
