import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountRouter from "./account";
import walletRouter from "./wallet";
import marketRouter from "./market";
import tradesRouter from "./trades";
import portfolioRouter from "./portfolio";
import adminRouter from "./admin";
import autoTradingRouter from "./auto-trading";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(walletRouter);
router.use(marketRouter);
router.use(tradesRouter);
router.use(portfolioRouter);
router.use(adminRouter);
router.use(autoTradingRouter);

export default router;
