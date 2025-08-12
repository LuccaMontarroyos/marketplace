"use client";

export interface CarrinhoItemProps {
    onClick?: ()=> void;
    icone?: React.ElementType
}

export default function CarrinhoItem(props: CarrinhoItemProps) {
    return (
        <button className="flex items-center" onClick={props.onClick}>
            {props.icone && <props.icone size={25} stroke={1.5} />}
        </button>
    )
};
