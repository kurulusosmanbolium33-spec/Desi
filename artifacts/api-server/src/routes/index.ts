import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videosRouter from "./videos";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videosRouter);
router.use(categoriesRouter);
router.use(tagsRouter);
router.use(adminRouter);

export default router;
