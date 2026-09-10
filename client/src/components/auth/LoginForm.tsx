"use client"

import { useState } from "react"
import { login } from "@/lib/api"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login({ email, password })
      window.location.href = "/"
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0a0a0a] text-white p-8 w-full max-w-sm mx-auto mt-20 border border-neutral-800 rounded-none shadow-none font-mono"
      aria-label="Login form"
    >
      <h2 className="text-xl font-bold tracking-tight mb-6 text-neutral-100 uppercase">Access</h2>

      <label htmlFor="email" className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors mb-4 rounded-none"
        placeholder="user@plutus.local"
      />

      <label htmlFor="password" className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Password</label>
      <input
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white transition-colors mb-6 rounded-none"
        placeholder="Enter your key"
      />

      {error && (
        <div className="mb-4 text-red-400 text-xs font-mono border border-red-900 px-3 py-2 bg-red-950/30" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors rounded-none disabled:opacity-40"
      >
        {loading ? "Verifying..." : "Authenticate"}
      </button>
    </form>
  )
}
