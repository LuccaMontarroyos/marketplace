import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { usuarioAutenticado } from '../middlewares/auth';

const router = Router();
const messageController = new MessageController();

router.get('/mensagens', usuarioAutenticado, (req, res) => messageController.index(req, res));
router.get('/mensagens/conversa/:idOutroUsuario', usuarioAutenticado, (req, res) => messageController.getConversation(req, res));
router.get('/mensagens/:id', usuarioAutenticado, (req, res) => messageController.show(req, res));
router.post('/mensagens', usuarioAutenticado, (req, res) => messageController.store(req, res));
router.delete('/mensagens/:id', usuarioAutenticado, (req, res) => messageController.destroy(req, res));

export default router;
