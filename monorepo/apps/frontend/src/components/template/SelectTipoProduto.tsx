type TipoProdutoEnum = "ELETRONICOS" | "MOVEIS" | "ROUPA" | "CALCADOS" | "LIVRO" | "AUTOMOVEIS" | "OUTROS";

export interface SelectTipoProdutoProps {
  value: TipoProdutoEnum;
  onChange: (value: TipoProdutoEnum) => void;
}

export default function SelectTipoProduto({ value, onChange }: SelectTipoProdutoProps) {
    return (
        <div className="flex flex-col static pt-10">
            <label htmlFor="TipoProduto">Categoria do produto</label>
            <select name="tipoProduto" value={value} onChange={(e) => onChange(e.target.value as TipoProdutoEnum)} className="bg-white rounded-xl border-2 w-9/11 border-gray-400 py-2 px-1 focus:outline-none focus:ring-0">
                <option value="" className="text-gray-400">Selecione uma categoria</option>
                <option value="ELETRONICOS">Eletrônicos</option>
                <option value="MOVEIS">Móveis</option>
                <option value="ROUPA">Roupa</option>
                <option value="CALCADOS">Calçados</option>
                <option value="LIVRO">Livro</option>
                <option value="AUTOMOVEIS">Automóveis</option>
                <option value="OUTROS">Outros</option>
            </select>
        </div>
    )
};
