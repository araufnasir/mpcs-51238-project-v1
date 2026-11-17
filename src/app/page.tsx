import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { btn } from "@/lib/ui";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Which Way</h1>
      <p className="text-lg text-foreground/70">
        Facing a big decision? List your options, decide what matters, and
        compare them side by side.
      </p>
      <Show when="signed-out">
        <SignUpButton forceRedirectUrl="/decisions" signInForceRedirectUrl="/decisions">
          <button className={btn.primary}>Get started</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/decisions" className={btn.primary}>
          Get started
        </Link>
      </Show>
    </div>
  );
}
