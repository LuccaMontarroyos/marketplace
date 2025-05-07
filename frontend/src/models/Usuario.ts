export interface Usuario {
    id: number
    nome: string
    email: string
    cpf: string
    celular: string
    isAdmin: boolean
    fotoPerfil?: string
}