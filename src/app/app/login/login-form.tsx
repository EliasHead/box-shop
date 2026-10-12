"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"

import { loginAction } from "./actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Box, Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(loginAction, undefined)

  return (
    <Card className="w-full shadow-lg border-slate-200/60 rounded-3xl overflow-hidden">
      <CardHeader className="space-y-3 pb-6 pt-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-inner">
          <Box className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription className="text-slate-500">
          Faça login para acessar o painel da sua loja
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="admin@boxshop.com" 
              required 
              className="rounded-xl h-11"
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              {/* This is out of scope for now, but we put a placeholder */}
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Esqueceu a senha?
              </a>
            </div>
            <Input 
              id="password" 
              name="password"
              type="password" 
              placeholder="••••••••"
              required 
              className="rounded-xl h-11"
              disabled={isPending}
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              <AlertCircle className="h-4 w-4" />
              <p>{errorMessage}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full rounded-xl h-11 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-md hover:shadow-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar no Painel"
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t border-slate-100 py-6 bg-slate-50/50">
        <p className="text-sm text-slate-500">
          Dúvidas? <a href="#" className="font-medium text-slate-900 hover:underline">Fale com o suporte</a>
        </p>
      </CardFooter>
    </Card>
  )
}
