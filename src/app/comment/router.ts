import { Router } from "express";
import Controller from "./controller";
import verifyToken from "../../middleware/verifyToken";


const router = Router();
const comment = new Controller();

router.get("/comment", verifyToken, comment.get);

export default router;