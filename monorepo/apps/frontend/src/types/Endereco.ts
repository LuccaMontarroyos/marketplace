export interface Endereco {
    id: number;
    idUsuario: number;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pontoReferencia?: string;
    createdAt: Date;
}

export interface DadosCadastroEndereco {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pontoReferencia?: string;
}

export interface DadosAtualizacaoEndereco {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    pontoReferencia?: string;
}

export type EnderecoFormData = Omit<Endereco, 'id' | 'idUsuario' | 'createdAt'>;