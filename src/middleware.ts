import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require admin role — staff users are redirected
// ┌─────────────────────────────────────────────────────┐
// │  REQUEST ──▶ auth check ──▶ admin-only route?       │
// │                               │          │          │
// │                             NO ──▶ allow YES        │
// │                                          │          │
// │                               fetch profile.role    │
// │                               │              │      │
// │                            admin ──▶ allow  staff   │
// │                                         ──▶ /admin  │
// └─────────────────────────────────────────────────────┘
const ADMIN_ONLY_ROUTES = ["/admin/invoices", "/admin/sms-log", "/admin/staff"];

function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Don't protect the login page itself
  if (request.nextUrl.pathname === "/admin/login") {
    const response = NextResponse.next();
    const supabase = createSupabaseMiddlewareClient(request, response);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return response;
  }

  // For all other /admin/* routes, require auth
  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Role check — only for admin-only routes (1B: minimal overhead)
  if (isAdminOnlyRoute(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
