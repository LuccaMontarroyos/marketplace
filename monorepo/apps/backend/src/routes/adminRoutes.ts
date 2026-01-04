import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { isAdminMiddleware } from '../middlewares/auth';

const router = Router();
const adminController = new AdminController();

router.get('/admin/usuarios', (req, res) => adminController.getUsers(req, res));
router.delete('/admin/usuarios/:id', isAdminMiddleware, (req, res) => adminController.deleteUser(req, res));

export default router;

