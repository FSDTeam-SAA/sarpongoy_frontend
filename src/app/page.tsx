"use client";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Next.js Boilerplate
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          A powerful starter template featuring Next.js 14, Tailwind CSS, shadcn/ui, NextAuth, and React Query.
        </p>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
            Go to Dashboard
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Documentation
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}


