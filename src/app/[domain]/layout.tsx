import { ReactNode } from "react"

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 w-full max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* 
        This is a typical mobile-first layout. 
        It centers and caps the width on desktop (max-w-md), 
        creating an app-like experience for the customer.
      */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
