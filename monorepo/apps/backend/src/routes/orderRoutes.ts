import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { usuarioAutenticado, usuarioAutenticadoOpcional, garantirSessionId } from '../middlewares/auth';

const router = Router();
const orderController = new OrderController();

router.get('/pedidos', usuarioAutenticado, (req, res) => orderController.index(req, res));
router.get('/pedidos/comprador', usuarioAutenticado, (req, res) => orderController.getByBuyer(req, res));
router.get('/pedidos/vendedor', usuarioAutenticado, (req, res) => orderController.getBySeller(req, res));
router.get('/pedidos/:id', usuarioAutenticado, (req, res) => orderController.show(req, res));
router.post('/pedidos', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => orderController.store(req, res));
router.put('/pedidos/:id', usuarioAutenticado, (req, res) => orderController.update(req, res));
router.delete('/pedidos/:id', usuarioAutenticado, (req, res) => orderController.destroy(req, res));
router.post('/pedidos/refazer', usuarioAutenticado, (req, res) => orderController.reorder(req, res));

export default router;

