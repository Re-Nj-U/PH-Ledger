// Auth is entirely server-side, so browser JavaScript never needs these tokens.
export function authCookieOptions(production = process.env.NODE_ENV === 'production') {
    return {
        name: production ? '__Host-piku-auth' : 'piku-auth',
        path: '/',
        secure: production,
        httpOnly: true,
        sameSite: 'lax' as const,
    };
}
