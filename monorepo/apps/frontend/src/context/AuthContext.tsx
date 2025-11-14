"use client";
  import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import type { Usuario } from "../types/Usuario";
import { obterToken, salvarToken, removerToken } from "@/utils/token";
import { buscarUsuarioPorId } from "@/services/usuario";

interface JwtPayload {
  id: number;
  nome: string;
  email: string;
}


type AuthContextType = {
  usuario: Usuario | null;
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  token: null,
  setToken: async () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);


  const atualizarToken = async (novoToken: string | null) => {
    if (novoToken) {
      salvarToken(novoToken); // salva corretamente no cookie
      setToken(novoToken);
      
      // Buscar e atualizar dados do usuário
      try {
        const decoded = jwtDecode<JwtPayload>(novoToken);
        const id = decoded.id;
        
        if (id) {
          const dados = await buscarUsuarioPorId(id);
          setUsuario(dados);
        } else {
          setUsuario(null);
        }
      } catch (error) {
        console.log(`Erro ao buscar usuário pelo id: ${error}`);
        setUsuario(null);
      }
    } else {
      removerToken(); // remove corretamente do cookie
      setToken(null);
      setUsuario(null);
    }
  };


  const logout = () => atualizarToken(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      const tokenSalvo = obterToken();
      if (tokenSalvo) {
        try {
          const decoded = jwtDecode<JwtPayload>(tokenSalvo);

          const id = decoded.id;

          if (id) {
            const dados = await buscarUsuarioPorId(id);
            setUsuario(dados);
            salvarToken(tokenSalvo);
            setToken(tokenSalvo);
          } else {
            logout();
          }
        } catch (error) {
          console.log(`Erro ao buscar usuário pelo id: ${error}`)
          logout();
        }
      } else {
        logout();
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
