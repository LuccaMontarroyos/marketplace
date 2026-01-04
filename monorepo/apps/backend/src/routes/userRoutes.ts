import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { usuarioAutenticado, usuarioAutenticadoOpcional } from '../middlewares/auth';

const router = Router();
const userController = new UserController();

router.post('/usuarios/cadastro', (req, res) => userController.store(req, res));
router.post('/usuarios/login', (req, res) => userController.login(req, res));
router.post('/usuarios/login/google', (req, res) => userController.loginGoogle(req, res));
router.get('/usuarios/:id', usuarioAutenticadoOpcional, (req, res) => userController.show(req, res));
router.put('/usuarios/:id', usuarioAutenticado, (req, res) => userController.update(req, res));
router.delete('/usuarios/:id', usuarioAutenticado, (req, res) => userController.destroy(req, res));
router.put('/usuarios/senha', usuarioAutenticado, (req, res) => userController.updatePassword(req, res));
router.get('/produtos/usuario', usuarioAutenticado, (req, res) => userController.getProducts(req, res));

export default router;
