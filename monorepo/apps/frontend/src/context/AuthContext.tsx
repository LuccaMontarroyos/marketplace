"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import type { Usuario } from "../types/Usuario";
import { obterToken, salvarToken } from "@/utils/token";
import { buscarUsuarioPorId } from "@/services/usuario";

interface JwtPayload {
  id: number;
  nome: string;
  email: string;
}


type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  token: null,
  setToken: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);


  const atualizarToken = (novoToken: string | null) => {
    if (novoToken) {
      localStorage.setItem("token", novoToken);
      setToken(novoToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
      setUsuario(null);
    }
  };


  const logout = () => atualizarToken(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      const tokenSalvo = obterToken();
      console.log("Token salvo: ", tokenSalvo);
      if (tokenSalvo) {
        try {
          const decoded = jwtDecode<JwtPayload>(tokenSalvo);
          console.log("Token decodado: ", decoded);
          const id = decoded.id;

          if (id) {
            const dados = await buscarUsuarioPorId(id);
            console.log("Dados do usuário: ", dados);
            setUsuario(dados);
            salvarToken(tokenSalvo);
          } else {
            logout();
          }
        } catch (error) {
          console.log(`Erro ao buscar usuário pelo id: ${error}`)
          logout();
        }
      }
    };
    carregarUsuario();
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, token, setToken: atualizarToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
