import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}

export default auth((req) => {
  const url = req.nextUrl
  
  // Get hostname of request (e.g. demo.boxshop.com, demo.localhost:3000)
  let hostname = req.headers
    .get('host')!
    .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`)

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes('---') &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split('---')[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`
  }

  const searchParams = req.nextUrl.searchParams.toString()
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`

  // rewrites for app pages
  const targetAppDomain = 'app.' + (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000')
  
  // Redirect app-related paths from tenant domains to the app subdomain
  const appPaths = ['/dashboard', '/onboarding', '/login']
  if (appPaths.some(p => path.startsWith(p)) && hostname !== targetAppDomain) {
    return NextResponse.redirect(new URL(`http://${targetAppDomain}${path}`))
  }

  if (hostname === targetAppDomain) {
    const session = req.auth
    
    // Allow access to login page
    if (path === '/login') {
      if (session) {
        return NextResponse.redirect(new URL('http://app.' + process.env.NEXT_PUBLIC_ROOT_DOMAIN))
      }
      return NextResponse.rewrite(new URL(`/app/login`, req.url))
    }
    
    // If not logged in and trying to access anything else on app.*
    if (!session) {
      return NextResponse.redirect(new URL(`http://app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/login`))
    }

    // Onboarding routing guards
    const hasTenant = !!session.user?.tenantId
    if (!hasTenant && path !== '/onboarding') {
      return NextResponse.redirect(new URL(`http://app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/onboarding`))
    }
    if (hasTenant && path === '/onboarding') {
      return NextResponse.redirect(new URL(`http://app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/dashboard`))
    }

    return NextResponse.rewrite(
      new URL(`/app${path === '/' ? '' : path}`, req.url)
    )
  }

  // rewrite root application to `/(marketing)`
  if (
    hostname === 'localhost:3000' ||
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ) {
    return NextResponse.rewrite(new URL(`/(marketing)${path}`, req.url))
  }

  // rewrite everything else to `/[domain]/[slug]` dynamic route
  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url))
})
