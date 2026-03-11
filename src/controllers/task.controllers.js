
import { asyncHandler } from "../utils/async-handler.js";
export const createTask = asyncHandler(async (req, res) => {
    // verify projects exits
    const {projectId} = req.params

    const {} = req.body
});

export default createTask;