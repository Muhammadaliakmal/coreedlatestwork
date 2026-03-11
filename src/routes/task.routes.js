import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { requireProjectMember ,requireProjectAdmin} from "../middlewares/project.middleware.js";
const router = express.Router();


router.use(verifyJWT);// checking your login status

router.route("/:projectId").all(requireProjectMember,requireProjectAdmin).post(createTask)

export default router;