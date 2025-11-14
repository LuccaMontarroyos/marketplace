import { Produto } from "./Produto";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  celular: string;
  fotoPerfil: string;
  isAdmin: boolean;
  isVendedor: boolean;
  produtos: Produto[];
  createdAt: Date;
  updatedAt: Date;
};

export type DadosAtualizacaoUsuario = {
  nome?: string;
  email?: string;
  senha?: string;
  cpf?: string;
  celular?: string;
  fotoPerfil?: string;
}

export type DadosTrocaSenha = {
  senhaAtual: string;
  senhaNova: string;
}