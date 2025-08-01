import Cookies from 'js-cookie';

const TOKEN_KEY = "token";

export const salvarToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    secure: true,
    sameSite: 'strict',
  });
};

export const obterToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const removerToken = () => {
  Cookies.remove(TOKEN_KEY);
};
