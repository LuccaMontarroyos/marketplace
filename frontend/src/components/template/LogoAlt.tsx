import Image from "next/image"
import Link from "next/link"
export default function LogoAlt() {
    return (
        <header className="bg-white w-full">
            <Link href={"/"} >
                <Image src={"/LogoMarketplace2.png"} alt="Logo do Marketplace na cor verde" width={120} height={120} />
            </Link>
        </header>
    )
};
