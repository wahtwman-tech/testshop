import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sheepRouter from "./sheep";
import ordersRouter from "./orders";
import authRouter from "./auth";
import profileRouter from "./profile";
import addressesRouter from "./addresses";
import contentRouter from "./content";
import paymentRouter from "./payment";
import adminAuthRouter from "./admin-auth";
import adminSheepRouter from "./admin-sheep";
import adminOrdersRouter from "./admin-orders";
import adminContentRouter from "./admin-content";
import adminCustomersRouter from "./admin-customers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sheepRouter);
router.use(ordersRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(addressesRouter);
router.use(contentRouter);
router.use("/payment", paymentRouter);
router.use(adminAuthRouter);
router.use(adminSheepRouter);
router.use(adminOrdersRouter);
router.use(adminContentRouter);
router.use(adminCustomersRouter);

export default router;
