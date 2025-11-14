import Link from "next/link";

export interface NavBarItemProps {
  link?: string;
  texto: string;
  onClick?: () => void;
}

export default function NavBarItem({ link, texto, onClick }: NavBarItemProps) {
  const style =
    "botao transition-all duration-300 ease-in-out text-center text-white px-4 md:px-6 py-2 rounded-lg hover:shadow-lg min-w-[80px] md:min-w-[100px] flex items-center justify-center text-sm md:text-base font-medium";

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

