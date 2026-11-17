import { Show, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight">Which Way</h1>
      <p className="text-lg text-foreground/70">
        Facing a big decision? List your options, decide what matters, and
        compare them side by side.
      </p>
      <Show when="signed-out">
        <SignUpButton>
          <button className="rounded-md bg-foreground px-4 py-2 text-background">
            Get started
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <p className="text-foreground/70">You&apos;re signed in.</p>
      </Show>
    </div>
  );
}
