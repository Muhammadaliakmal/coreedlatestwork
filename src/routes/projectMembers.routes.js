// src\routes\projectMembers.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { listProjectMember,addProjectMember } from "../controllers/projectMembers.controllers.js";
import { requireProjectMember ,requireProjectAdmin} from "../middlewares/project.middleware.js";
const router = express.Router();

// Middleware
router.use(verifyJWT);// this will verify the token before allowing access to the route

router.use(requireProjectMember);// this will check if the user is a member of this project

router.route("/").get(listProjectMember);// this will list all the members of a project

router.route("/").post(requireProjectAdmin,addProjectMember);// this will add a member to a project

export default router;
