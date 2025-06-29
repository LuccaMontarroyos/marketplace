import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react"
export default function Rodape() {
    return (
        <footer className="bg-verde text-white py-10 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Marca */}
        <div>
          <h2 className="text-2xl font-bold">LB Marketplace</h2>
          <p className="text-sm mt-2">
            Conectando vendedores e compradores em um só lugar.
          </p>
        </div>

        {/* Links Rápidos */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Links</h3>
          <ul className="space-y-1 text-sm">
            <li><a href="#" className="hover:underline">Início</a></li>
            <li><a href="/produtos" className="hover:underline">Produtos</a></li>
            <li><a href="/perfil" className="hover:underline">Perfil</a></li>
            <li><a href="/contato" className="hover:underline">Contato</a></li>
          </ul>
        </div>

        {/* Informações */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Informações</h3>
          <ul className="space-y-1 text-sm">
            <li>Política de Privacidade</li>
            <li>Termos de Uso</li>
            <li>Suporte ao Cliente</li>
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Contato</h3>
          <p className="text-sm">Email: suporte@lbmarketplace.com</p>
          <p className="text-sm">Telefone: (81) 99999-9999</p>
          <div className="flex space-x-4 mt-3">
            {/* Ícones podem ser de uma lib como lucide-react ou react-icons */}
            <a href="#" className="hover:text-gray-300"><IconBrandFacebook size={50} /></a>
            <a href="#" className="hover:text-gray-300"><IconBrandInstagram size={50} /></a>
            <a href="#" className="hover:text-gray-300"><IconBrandLinkedin size={50} /></a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 mt-8 pt-4 text-center text-sm">
        © {new Date().getFullYear()} LB Marketplace. Todos os direitos reservados.
      </div>
        </footer>
    )
};
