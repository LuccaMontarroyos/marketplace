import { App } from './App';
import { setWebSocketService } from './controllers/MessageController';

const app = new App();
const webSocketService = app.getWebSocketService();

if (webSocketService) {
  setWebSocketService(webSocketService);
}

app.start();
