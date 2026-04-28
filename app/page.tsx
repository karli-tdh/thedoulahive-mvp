import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        The Doula Hive
      </h1>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button size="lg">I&apos;m a doula</Button>
        <Button size="lg" variant="outline">
          I&apos;m expecting
        </Button>
      </div>
    </main>
  );
}
