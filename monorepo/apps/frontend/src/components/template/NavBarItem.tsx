import Link from "next/link"

export interface NavBarItemProps {
    link: string
    texto: string
}
export default function NavBarItem(props: NavBarItemProps) {
    return (
        <Link href={props.link}>
            <p className="botao transition-colors duration-500 ease-in-out text-center text-white px-6 py-2 min-w-[100px] flex items-center justify-center">{props.texto}</p>
        </Link>
    )
};
