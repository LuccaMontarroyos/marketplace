"use client";
import Link from "next/link"

export interface CarrinhoItemProps {
    onClick?: ()=> void;
    link: string
    icone?: React.ElementType
}

export default function CarrinhoItem(props: CarrinhoItemProps) {
    return (
        <Link className="flex items-center" href={props.link} onClick={props.onClick}>
            {props.icone && <props.icone size={25} stroke={1.5} />}
        </Link>
    )
};
