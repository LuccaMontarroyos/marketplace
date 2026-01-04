import { Router } from 'express';
import express from 'express';
import { StripeController } from '../controllers/StripeController';
import { usuarioAutenticado } from '../middlewares/auth';

const router = Router();
const stripeController = new StripeController();

router.post('/stripe/account', usuarioAutenticado, (req, res) => stripeController.createAccount(req, res));
router.get('/stripe/account-link', usuarioAutenticado, (req, res) => stripeController.getAccountLink(req, res));
router.get('/stripe/account-status', usuarioAutenticado, (req, res) => stripeController.getAccountStatus(req, res));
router.get('/stripe/payouts', usuarioAutenticado, (req, res) => stripeController.getPayouts(req, res));
router.post('/stripe/webhook', express.raw({ type: "application/json" }), (req, res) => stripeController.handleWebhook(req, res));

export default router;
