import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is a simplified version.
// Real-world Firebase middleware usually involves reading session cookies.
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // For now, we'll let the client handle auth redirection to keep it simple,
    // but we provide the structure for protected routes.

    // Example: if (pathname.startsWith('/admin') && !hasAdminCookie) return redirect...

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
