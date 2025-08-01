"use client";
import InputPreco from "@/components/template/InputPreco";
import UploadImagem from "@/components/template/UploadImagens";
import SelectTipoProduto from "@/components/template/SelectTipoProduto";
import Link from "next/link";
import { cadastroProdutoSchema } from "../../../../../../../packages/shared/schemas/produto";
import { useState } from "react";
import z from "zod";

enum TipoProduto {
    ELETRONICOS = "Eletrônicos",
    MOVEIS = "Móveis",
    ROUPA = "Roupas",
    CALCADOS = "Calçados",
    LIVRO = "Livros",
    AUTOMOVEIS = "Automóveis",
    OUTROS = "Outros"
}

export interface CadastroProdutoProps {
    nomeProduto: string
    descricao: string
    preco: number
    qtdEstoque: number
    idVendedor: number
    tipo: TipoProduto
    imagem?: string
}

export default function CadastroProduto() {

    type CadastroProdutoFormData = z.infer<typeof cadastroProdutoSchema>;

    const [formData, setFormData] = useState<CadastroProdutoFormData>({
        nomeProduto: "",
        descricao: "",
        preco: 0,
        qtdEstoque: 1,
        tipo: "OUTROS",
        imagem: "",
    });
    const [imagens, setImagens] = useState<string[]>([]);

    const [errors, setErrors] = useState<Partial<Record<keyof CadastroProdutoFormData, string>>>({});

    const handleSubmit = () => {
        const parsed = cadastroProdutoSchema.safeParse(formData);
        if (!parsed.success) {
            const fieldErrors: any = {};
            parsed.error.errors.forEach((err) => {
                const field = err.path[0] as keyof CadastroProdutoFormData;
                fieldErrors[field] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }
        console.log('Ta dando certo');
    }
    return (
        <div className="p-10 bg-gray-100 text-black h-screen flex flex-col">
            <h2 className="text-3xl mb-5">Cadastrar Produto</h2>
            <div className="grid grid-cols-2 gap-y-10 gap-x-10">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col">
                        <label htmlFor="nameInput">Nome do produto</label>
                        <input className="border-2 rounded-xl p-2 bg-white border-gray-400 w-9/11" type="text" id="nameInput" value={formData.nomeProduto} onChange={(e) => setFormData({ ...formData, nomeProduto: e.target.value })} />
                        {errors.nomeProduto && <span className="text-red-500 text-sm">{errors.nomeProduto}</span>}
                    </div>
                    <div>
                        <label>Adicione até 6 imagens</label>
                        <UploadImagem value={imagens}
                            onChangeImagens={(lista) => {
                                setImagens(lista);
                                setFormData((prev: any) => ({
                                    ...prev,
                                    imagem: lista[0] || "", // salva só a primeira por enquanto
                                }));
                            }}
                        />
                        {errors.imagem && <span className="text-red-500 text-sm">{errors.imagem}</span>}
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="priceInput">Preço</label>
                        <InputPreco value={formData.preco}
                            onChange={(val) =>
                                setFormData((prev: any) => ({ ...prev, preco: val }))
                            }
                        />
                        {errors.preco && <span className="text-red-500 text-sm">{errors.preco}</span>}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                        <label htmlFor="descriptionInput">Descrição</label>
                        <textarea className="border-2 w-9/11 border-gray-400 bg-white rounded-xl p-2 py-2 resize-none placeholder:text-gray-400 transition"
                            rows={4} placeholder="Escreva a descrição detalhada do produto..."
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                        {errors.descricao && <span className="text-red-500 text-sm">{errors.descricao}</span>}
                    </div>
                    <SelectTipoProduto value={formData.tipo} onChange={(value) => setFormData({ ...formData, tipo: value })} />
                    {errors.tipo && <span className="text-red-500 text-sm">{errors.tipo}</span>}
                    <div className="flex flex-col pt-8">
                        <label htmlFor="">Quantidade em estoque</label>
                        <input type="number" min={1} placeholder="0" className="bg-white w-1/4 rounded-xl border-2 border-gray-400 py-2 px-1 focus:outline-none focus:ring-0 text-center" value={formData.qtdEstoque}
                            onChange={(e) => setFormData({ ...formData, qtdEstoque: Number(e.target.value) })}
                        />
                        {errors.qtdEstoque && <span className="text-red-500 text-sm">{errors.qtdEstoque}</span>}
                    </div>
                    <div className=" flex justify-start pt-12">
                        <button onClick={handleSubmit} className="add-carrinho rounded-xl px-45 py-3 text-white">Cadastrar</button>
                    </div>
                </div>

            </div>
            <Link href={"/"} className="mt-15 self-center">
                <p className="text-xl">Cancelar</p>
            </Link>
        </div>
    )
};
