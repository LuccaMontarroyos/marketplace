import Link from "next/link";

export interface NavBarItemProps {
  link?: string;
  texto: string;
  onClick?: () => void;
}

export default function NavBarItem({ link, texto, onClick }: NavBarItemProps) {
  const style =
    "botao transition-colors duration-500 ease-in-out text-center text-white px-6 py-2 min-w-[100px] flex items-center justify-center";

  if (onClick) {
    return (
      <button onClick={onClick} className={style}>
        {texto}
      </button>
    );
  }

  return (
    <Link href={link ?? "/"}>
      <p className={style}>{texto}</p>
    </Link>
  );
}

