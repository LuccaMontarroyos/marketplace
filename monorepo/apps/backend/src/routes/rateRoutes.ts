import { Router } from 'express';
import { RateController } from '../controllers/RateController';
import { usuarioAutenticado } from '../middlewares/auth';

const router = Router();
const rateController = new RateController();

router.get('/avaliacoes/:idProduto', usuarioAutenticado, (req, res) => rateController.index(req, res));
router.get('/avaliacoes/:id', usuarioAutenticado, (req, res) => rateController.show(req, res));
router.post('/avaliacoes', usuarioAutenticado, (req, res) => rateController.store(req, res));
router.delete('/avaliacoes/:id', usuarioAutenticado, (req, res) => rateController.destroy(req, res));

export default router;
