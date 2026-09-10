"use client"

import { useState } from "react"
import { login, register } from "@/lib/api"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (mode === "register") {
        await register({ email, password })
      } else {
        await login({ email, password })
      }
      window.location.href = "/"
    } catch (err: any) {
      setError(err.message || (mode === "register" ? "Registration failed" : "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative bg-[#050505] border border-neutral-700 rounded-none p-10 w-full max-w-md mx-auto shadow-[0_0_0_1px_rgba(255,255,255,0.06)] font-mono overflow-hidden"
      aria-label="Secure access terminal"
    >
      {/* Subtle structural grid lines — raw control-panel feel */}
      <div className="absolute top-0 left-0 right-0 h-px bg-neutral-800" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-800" aria-hidden="true" />

      <div className="mb-8">
        <h2 className="text-2xl font-black tracking-tighter text-neutral-50 mb-1">ACCESS TERMINAL</h2>
        <p className="text-[10px] text-neutral-600 tracking-[0.2em] uppercase">Plutus / Secure Session</p>
      </div>

      <div className="grid grid-cols-[1fr_3fr] gap-y-4 gap-x-3 mb-6">
        <label htmlFor="email" className="text-[10px] text-neutral-400 uppercase tracking-widest self-center">Identity</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-sm font-mono text-neutral-100 focus:outline-none focus:border-neutral-400 transition-colors rounded-none placeholder:text-neutral-700 placeholder:text-xs"
          placeholder="user@plutus.local"
        />

        <label htmlFor="password" className="text-[10px] text-neutral-400 uppercase tracking-widest self-center">Key</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-sm font-mono text-neutral-100 focus:outline-none focus:border-neutral-400 transition-colors rounded-none placeholder:text-neutral-700 placeholder:text-xs"
          placeholder="••••••••••••"
        />
      </div>

      {error && (
        <div className="mb-5 border border-red-900/60 bg-red-950/20 px-3 py-2.5 text-xs font-mono text-red-300" role="alert">
          <span className="text-red-500 text-[10px] uppercase tracking-widest block mb-0.5">Error</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-neutral-100 text-[#050505] px-4 py-3 text-xs font-black uppercase tracking-[0.15em] hover:bg-white active:translate-y-px transition-all rounded-none disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
      >
        {loading ? (mode === "register" ? "Registering..." : "Verifying...") : (mode === "register" ? "Create Account →" : "Authenticate →")}
      </button>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => { setMode(mode === "register" ? "login" : "register"); setError("") }}
          className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] hover:text-white transition-colors underline underline-offset-2"
        >
          {mode === "register" ? "← Return to login" : "No account? Register"}
        </button>
      </div>
    </form>
  )
}
