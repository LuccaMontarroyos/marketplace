import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const rotasProtegidas = ['/perfil', '/usuario/enderecos', '/usuario/produtos'];

  const url = request.nextUrl;

  const tentandoAcessarProtegida = rotasProtegidas.some((rota) =>
    url.pathname.startsWith(rota)
  );

  if (tentandoAcessarProtegida && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/perfil/:path*',
    '/usuario/enderecos/:path*',
    '/usuario/produtos/:path*'
  ],
};
