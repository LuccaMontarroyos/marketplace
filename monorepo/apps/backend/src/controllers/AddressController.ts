import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { enderecoSchema } from '../../../../packages/shared/schemas/enderecos';

const estadosValidos = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export class AddressController extends BaseController {
    async index(req: Request, res: Response): Promise<Response> {
        try {
            const usuario = this.getUsuario(req);

            const enderecosDoUsuario = await this.prisma.endereco.findMany({
                where: { idUsuario: usuario.id },
                orderBy: { createdAt: 'asc' }
            });

            if (enderecosDoUsuario.length === 0) {
                return this.sendError(res, 404, 'Usuário não possui nenhum endereço cadastrado');
            }

            return this.sendSuccess(res, 200, enderecosDoUsuario);

        } catch (error) {
            return this.sendError(res, 500, 'Erro ao buscar endereços', error);
        }
    }

    async show(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return this.sendError(res, 400, 'ID inválido');
            }

            const endereco = await this.prisma.endereco.findUnique({
                where: { id }
            });

            if (!endereco) {
                return this.sendError(res, 404, 'Endereço não encontrado');
            }

            return this.sendSuccess(res, 200, endereco);

        } catch (error) {
            return this.sendError(res, 500, 'Erro ao buscar endereço', error);
        }
    }

    async store(req: Request, res: Response): Promise<Response> {
        try {
            const parsedBody = enderecoSchema.safeParse(req.body);
            if (!parsedBody.success) {
                return this.sendError(res, 400, 'Dados inválidos', parsedBody.error.errors);
            }

            const { logradouro, numero, bairro, complemento, cidade, cep, estado, pontoReferencia } = parsedBody.data;
            const usuario = this.getUsuario(req);
            const sessionId = this.getSessionId(req);

            if (!estadosValidos.includes(estado.toUpperCase())) {
                return this.sendError(res, 400, 'Estado inválido. Use a sigla (ex: PE, SP, RJ).');
            }

            const enderecoExistente = await this.prisma.endereco.findFirst({
                where: {
                    cep,
                    logradouro,
                    cidade,
                    estado,
                    numero,
                    bairro
                }
            });

            if (enderecoExistente) {
                return this.sendError(res, 400, 'Endereço já cadastrado');
            }

            const endereco = await this.prisma.endereco.create({
                data: {
                    cep,
                    cidade,
                    estado: estado.toUpperCase(),
                    logradouro,
                    complemento,
                    bairro,
                    numero,
                    pontoReferencia,
                    idUsuario: usuario?.id || null,
                    sessionId: usuario ? null : sessionId
                }
            });

            return this.sendSuccess(res, 201, endereco);

        } catch (error) {
            return this.sendError(res, 500, 'Erro ao cadastrar endereço', error);
        }
    }

    async update(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return this.sendError(res, 400, 'ID inválido');
            }

            const resultado = enderecoSchema.partial().safeParse(req.body);
            if (!resultado.success) {
                return this.sendError(res, 400, 'Dados inválidos', resultado.error.errors);
            }

            const data = resultado.data;
            const usuario = this.getUsuario(req);

            const endereco = await this.prisma.endereco.findFirst({
                where: { id }
            });

            if (!endereco) {
                return this.sendError(res, 404, 'Endereço não encontrado');
            }

            if (endereco.idUsuario != usuario.id) {
                return this.sendError(res, 403, 'Você não tem permissão para acessar um endereço de outra pessoa');
            }

            const dataUpdate = {
                logradouro: data.logradouro,
                cidade: data.cidade,
                cep: data.cep,
                estado: data.estado,
                numero: data.numero,
                bairro: data.bairro,
                complemento: data.complemento,
                pontoReferencia: data.pontoReferencia
            };

            const enderecoAtualizado = await this.prisma.endereco.update({
                where: { id },
                data: dataUpdate
            });

            return this.sendSuccess(res, 200, { endereco: enderecoAtualizado }, 'Endereço atualizado com sucesso');

        } catch (error) {
            return this.sendError(res, 500, 'Erro ao atualizar endereço', error);
        }
    }

    async destroy(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return this.sendError(res, 400, 'ID inválido');
            }

            const usuario = this.getUsuario(req);

            const endereco = await this.prisma.endereco.findFirst({
                where: { id }
            });

            if (!endereco) {
                return this.sendError(res, 404, 'Não foi possível encontrar o endereço');
            }

            if (endereco.idUsuario !== usuario.id) {
                return this.sendError(res, 403, 'Você não pode excluir o endereço cadastrado de outro usuário');
            }

            await this.prisma.endereco.delete({
                where: { id }
            });

            return this.sendSuccess(res, 200, null, 'Endereço excluído com sucesso');

        } catch (error) {
            return this.sendError(res, 500, 'Erro ao excluir endereço', error);
        }
    }
}

