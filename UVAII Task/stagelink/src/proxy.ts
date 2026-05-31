import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  const isAuthed = request.cookies.get('sl_authed')?.value === '1'

  if (!isAuthed) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
