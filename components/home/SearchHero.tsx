"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlowBackground } from "@/components/shared/GlowBackground";

// Home hero — Figma screen 1: headline + centered search pill over a soft glow.
export function SearchHero() {
  const router = useRouter();
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    // Sprint 2: navigate to a demo results plan, carrying the query.
    router.push(`/results/demo?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6">
      <GlowBackground />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center text-3xl font-bold sm:text-4xl"
      >
        Bạn cần mua gì hôm nay?
      </motion.h1>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl"
      >
        <label htmlFor="home-search" className="sr-only">
          Mô tả món bạn muốn nấu hoặc mua
        </label>
        <input
          id="home-search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Tôi muốn nấu bún bò Huế cho 4 người…"
          className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-base shadow-sm outline-none transition-shadow focus:shadow-md"
        />
      </motion.form>
    </section>
  );
}
