import api from './api';

interface CadastroPayload {
    nome: string;
    email: string;
    senha: string;
    celular: string;
    cpf: string;
    fotoPerfil?: string
}

interface LoginPayload {
  email: string;
  senha: string;
}

export const cadastrarUsuario = async (usuario: CadastroPayload) => {
  const response = await api.post('/usuarios/cadastro', usuario, {
    headers: {
        'Content-Type': 'application/json',
    }
  });
  return response.data;
};

export const loginUsuario = async (dados: LoginPayload) => {
  const response = await api.post('/usuarios/login', dados, {
    headers: {
        'Content-Type': 'application/json',
    }
  });
  return response.data;
};

export const loginGoogle = async (credential: string) => {
  const response = await api.post('/usuarios/login/google', { credential }, {
    headers: {
        'Content-Type': 'application/json',
    }
  });
  return response.data;
};