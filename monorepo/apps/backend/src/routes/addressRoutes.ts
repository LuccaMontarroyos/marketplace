import { Router } from 'express';
import { AddressController } from '../controllers/AddressController';
import { usuarioAutenticado, usuarioAutenticadoOpcional, garantirSessionId } from '../middlewares/auth';

const router = Router();
const addressController = new AddressController();

router.get('/enderecos', usuarioAutenticado, (req, res) => addressController.index(req, res));
router.get('/enderecos/:id', usuarioAutenticado, (req, res) => addressController.show(req, res));
router.post('/enderecos', usuarioAutenticadoOpcional, garantirSessionId, (req, res) => addressController.store(req, res));
router.put('/enderecos/:id', usuarioAutenticado, (req, res) => addressController.update(req, res));
router.delete('/enderecos/:id', usuarioAutenticado, (req, res) => addressController.destroy(req, res));

export default router;
