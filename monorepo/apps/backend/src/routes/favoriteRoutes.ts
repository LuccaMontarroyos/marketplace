import { Router } from 'express';
import { FavoriteController } from '../controllers/FavoriteController';
import { usuarioAutenticado } from '../middlewares/auth';

const router = Router();
const favoriteController = new FavoriteController();

router.get('/favoritos', usuarioAutenticado, (req, res) => favoriteController.index(req, res));
router.post('/favoritos', usuarioAutenticado, (req, res) => favoriteController.store(req, res));
router.delete('/favoritos/:idProduto', usuarioAutenticado, (req, res) => favoriteController.destroy(req, res));

export default router;
