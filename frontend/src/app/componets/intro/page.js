import React from 'react'
import Image from "next/image";
import Link from "next/link";

export default function page() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-white">

      {/* Logo */}
      <Link href="/" >
        <Image
          src="/images/logo.png"
          alt="Manzilo Logo"
          width={200}
          height={200}
          priority
          className="rounded-full "
        />
      </Link>

      {/* Heading */}

      <h1 className="mt-6 text-4xl md:text-5xl font-bold ">
        Manzilo
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-text-light text-center text-base md:text-lg">
        Track your bus live in Faisalabad
      </p>

      {/* Buttons */}
      <div className="mt-10 flex flex-col gap-4 w-full max-w-sm">

        <Link
          href="/passenger"
          className="w-full rounded-lg bg-primary py-3 text-center text-white font-medium transition hover:opacity-90 hover:bg-[#dd6d47]"
        >
          Continue as Passenger
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link
            href="/login"
            className="w-full rounded-lg bg-primary py-3 text-center text-white font-medium transition hover:opacity-90 hover:bg-[#dd6d47]"
          >
            Driver Login
          </Link>

          <Link
            href="/admin"
            className="w-full rounded-lg bg-primary py-3 text-center text-white font-medium transition hover:opacity-90 hover:bg-[#dd6d47]"
          >
            Admin Login
          </Link>

        </div>

      </div>
    </section>
  )
}
