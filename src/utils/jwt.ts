export function parseJwt(token: string): Record<string, unknown> | null {
    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) return null
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

export function extractRolesFromToken(token: string): string[] {
    if (!token) return []
    const payload = parseJwt(token)
    if (!payload) return []

    const roleClaim =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/roles'] ||
        payload['role'] ||
        payload['roles']

    let extracted: string[] = []
    if (Array.isArray(roleClaim)) {
        extracted = roleClaim.map(String)
    } else if (typeof roleClaim === 'string') {
        extracted = [roleClaim]
    }

    return extracted.map((r) => {
        if (r.toLowerCase() === 'admin') return 'Admin'
        if (r.toLowerCase() === 'user') return 'User'
        return r
    })
}
