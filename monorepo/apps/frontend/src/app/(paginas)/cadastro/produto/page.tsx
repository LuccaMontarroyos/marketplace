    "use client";
    import InputPreco from "@/components/template/InputPreco";
    import UploadImagem from "@/components/template/UploadImagens";
    import SelectTipoProduto from "@/components/template/SelectTipoProduto";
    import Link from "next/link";
    import { cadastroProdutoSchema } from "../../../../../../../packages/shared/schemas/produto";
    import { useState } from "react";
    import z from "zod";
    import { cadastrarProduto } from "@/services/produto";
    import { useRouter } from "next/navigation";
    import { toast } from "react-toastify";
    import { criarContaStripe, gerarLinkOnBoarding } from "@/services/stripe";

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
        nomeProduto: string;
        descricao: string;
        preco: number;
        qtdEstoque: number;
        idVendedor: number;
        tipo: TipoProduto;
    }

    export default function CadastroProduto() {
        const router = useRouter();

        type CadastroProdutoFormData = z.infer<typeof cadastroProdutoSchema>;

        const [formData, setFormData] = useState<CadastroProdutoFormData>({
            nomeProduto: "",
            descricao: "",
            preco: 0,
            qtdEstoque: 1,
            tipo: "",
        });
        const [imagens, setImagens] = useState<File[]>([]);

        const [errors, setErrors] = useState<Partial<Record<keyof CadastroProdutoFormData, string>>>({});

        const handleSubmit = async () => {
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

            try {
                const form = new FormData();
                form.append("nome", formData.nomeProduto);
                form.append("descricao", formData.descricao);
                form.append("preco", formData.preco.toString());
                form.append("qtdEstoque", formData.qtdEstoque.toString());
                form.append("tipoProduto", formData.tipo);

                imagens.slice(0, 6).forEach((file, index) => {
                    form.append("imagens", file);
                    form.append("ordens", (index + 1).toString());
                });


                await cadastrarProduto(form);
                toast.success("Produto criado com sucesso!");
                router.push("/");
            } catch (error: any) {
                console.error("Erro ao cadastrar:", error);
                
                if (error.response?.status === 403 && error.response?.data?.erro === "Usuário não tem conta Stripe para vender.") {
                    const criarConta = window.confirm(
                        "Você precisa criar uma conta no Stripe para vender produtos. Deseja criar agora?"
                    );
                    
                    if (criarConta) {
                        try {
                            await criarContaStripe().catch((err) => {
                                if (err.response?.data?.erro === "Usuário já possui conta no Stripe.") {
                                    console.log("Conta Stripe já existe, seguimos...");
                                } else {
                                    throw err;
                                }
                            });
                            
                            const linkData = await gerarLinkOnBoarding();
                            window.location.href = linkData.url;
                        } catch (stripeError) {
                            console.error("Erro ao criar conta Stripe:", stripeError);
                            toast.error("Erro ao criar conta Stripe. Tente novamente.");
                        }
                    }
                } else {
                    toast.error("Erro ao criar produto");
                }
            }
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
                            <label>Adicione até 6 imagens: (A primeira imagem será a capa do produto)</label>
                            <UploadImagem value={imagens}
                                onChangeImagens={(listaDeFiles) => {
                                    setImagens(listaDeFiles);
                                }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="priceInput">Preço</label>
                            <InputPreco className="w-9/11 bg-white border-2 border-gray-400 rounded-xl px-4 py-2" value={formData.preco}
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
