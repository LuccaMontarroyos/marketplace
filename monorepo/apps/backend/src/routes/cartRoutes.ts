import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { usuarioAutenticadoOpcional, garantirSessionId } from '../middlewares/auth';

const router = Router();
const cartController = new CartController();

router.get('/carrinho', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => cartController.index(req, res));
router.post('/carrinho', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => cartController.store(req, res));
router.patch('/carrinho', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => cartController.update(req, res));
router.delete('/carrinho/:idProduto', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => cartController.destroy(req, res));

export { CartController };
export default router;
