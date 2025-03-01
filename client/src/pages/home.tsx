import { Button } from "@/components/ui/button";
import WaitlistForm from "@/components/waitlist-form";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Zerodigit
          </h1>
          <Link href="/admin/login">
            <Button variant="ghost">Admin Login</Button>
          </Link>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Future of Digital Innovation
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join the waitlist to be among the first to experience our groundbreaking technology platform.
            </p>
            <WaitlistForm />
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg bg-background shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Experience unprecedented speed and performance with our optimized platform.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-background shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Secure by Design</h3>
                <p className="text-muted-foreground">
                  Built with security first principles to protect your valuable data.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-background shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Scalable Solution</h3>
                <p className="text-muted-foreground">
                  Grows with your business needs without compromising performance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 Zerodigit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
