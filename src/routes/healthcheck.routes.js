import express from "express";
const router = express.Router();
import { healthcheck } from "../controllers/healthcheck.controllers.js";

router.route("/").get(healthcheck);
// router.get("/",healthcheck) 'previous methods'

export default router;
