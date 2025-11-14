"use client";

export interface CarrinhoItemProps {
    onClick?: () => void;
    icone?: React.ElementType
}

export default function CarrinhoItem(props: CarrinhoItemProps) {
    return (
        <button
            className="flex items-center justify-center p-2 rounded-lg hover:bg-white/20 transition-colors duration-300"
            onClick={props.onClick}
            title="Carrinho"
        >
            {props.icone && <props.icone size={24} stroke={2} className="text-white" />}
        </button>
    )
};
