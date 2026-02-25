import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
    // This `try...catch` block is only needed if you want to use the middleware
    // to refresh the session.
    try {
        // Create an unmodified response
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set({ name, value, ...options })
                        );
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set({ name, value, ...options })
                        );
                    },
                },
            }
        );

        // This will refresh session if expired - required for Server Components
        // https://supabase.com/docs/guides/auth/server-side/nextjs
        const { data: { user } } = await supabase.auth.getUser();

        // PROTECTED ROUTES LOGIC
        // If user is not logged in and trying to access anything other than login/auth/landing
        const isPublicPath =
            request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname.startsWith('/login') ||
            request.nextUrl.pathname.startsWith('/auth') ||
            request.nextUrl.pathname.startsWith('/jadwal/');

        if (!user && !isPublicPath) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // If user is logged in and trying to access login page
        if (user && request.nextUrl.pathname.startsWith('/login')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        return response;
    } catch (e) {
        // If you are here, a Supabase client could not be created!
        // This is probably because you have not set up environment variables.
        // Check out http://localhost:3000 for NextSteps.
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }
};
