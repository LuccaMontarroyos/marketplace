"use client";
import InputPreco from "@/components/template/InputPreco";
import UploadImagem from "@/components/template/UploadImagem";
import SelectTipoProduto from "@/components/template/SelectTipoProduto";    

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

    return (
        <div className="p-10 bg-gray-100 text-black h-screen">
            <h2 className="text-3xl mb-5">Cadastrar Produto</h2>
            <div className="grid grid-cols-2 gap-y-10 gap-x-10">
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col">
                        <label htmlFor="nameInput">Nome do produto</label>
                        <input className="border-2 rounded-xl p-2 bg-white border-gray-400 w-9/11" type="text" id="nameInput" />
                    </div>
                    <div>
                        <label>Adicione até 6 imagens</label>
                        <UploadImagem />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="priceInput">Preço</label>
                        <InputPreco />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                        <label htmlFor="descriptionInput">Descrição</label>
                        <textarea className="border-2 w-9/11 border-gray-400 bg-white rounded-xl p-2 py-2 resize-none placeholder:text-gray-400 transition"
                            rows={4} placeholder="Escreva a descrição detalhada do produto..."
                        />
                    </div>
                    <SelectTipoProduto />
                    <div className="flex flex-col pt-8">
                        <label htmlFor="">Quantidade em estoque</label>
                        <input type="number" min={1} placeholder="0" className="bg-white w-1/4 rounded-xl border-2 border-gray-400 py-2 px-1 focus:outline-none focus:ring-0 text-center" />
                    </div>
                    <div className=" flex justify-start pt-12">
                        <button className="bg-verde hover:bg-azul rounded-xl px-45 py-3 text-white">Cadastrar</button>
                    </div>
                </div>

            </div>
        </div>
    )
};
