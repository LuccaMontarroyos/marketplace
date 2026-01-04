import { Router } from 'express';
import { ProductController, upload } from '../controllers/ProductController';
import { usuarioAutenticado, usuarioAutenticadoOpcional } from '../middlewares/auth';

const router = Router();
const productController = new ProductController();

router.get('/produtos', (req, res) => productController.index(req, res));
router.get('/produtos/:id', (req, res) => productController.show(req, res));
router.post('/produtos', usuarioAutenticado, upload.array('imagens', 6), (req, res) => productController.store(req, res));
router.put('/produtos/:id', usuarioAutenticado, upload.array('imagens', 6), (req, res) => productController.update(req, res));
router.delete('/produtos/:id', usuarioAutenticado, (req, res) => productController.destroy(req, res));

export default router;

