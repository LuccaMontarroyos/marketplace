import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { usuarioAutenticado, usuarioAutenticadoOpcional } from '../middlewares/auth';

const router = Router();
const paymentController = new PaymentController();

router.get('/pagamentos/:idPedido', usuarioAutenticado, (req, res) => paymentController.index(req, res));
router.get('/pagamentos/:id', usuarioAutenticadoOpcional, (req, res) => paymentController.show(req, res));
router.post('/pagamentos', usuarioAutenticado, (req, res) => paymentController.store(req, res));

export default router;

