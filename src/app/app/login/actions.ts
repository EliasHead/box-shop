"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData)
    return undefined
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "E-mail ou senha inválidos."
        default:
          return "Ocorreu um erro inesperado."
      }
    }
    // O Next.js vai interceptar o redirect de sucesso como um erro (isso é normal no App Router)
    throw error
  }
}
