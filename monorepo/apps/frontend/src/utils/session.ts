import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "sessionId";

export const obterSessionId = (): string => {
  const sessionId = Cookies.get(SESSION_KEY);

  if (!sessionId) {
    const novoId = uuidv4();
    Cookies.set(SESSION_KEY, novoId, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
    return novoId;
  }

  return sessionId;
};

export const removerSessionId = () => {
  Cookies.remove(SESSION_KEY);
};
