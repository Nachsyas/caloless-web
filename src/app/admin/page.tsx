"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (err: any) {
       // redirect throws an error, so we need to handle it properly or ignore it if it's NEXT_REDIRECT
       if (err.message !== "NEXT_REDIRECT") {
           setError("Terjadi kesalahan sistem.");
       }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl border border-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">Login untuk masuk ke dasbor manajemen CALOLESS.</p>
        </div>

        <form action={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="admin@caloless.id"
              className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold mt-4 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={isLoading}>
            {isLoading ? "Memverifikasi..." : "Masuk ke Dasbor"}
          </Button>
        </form>
      </div>
    </div>
  );
}
