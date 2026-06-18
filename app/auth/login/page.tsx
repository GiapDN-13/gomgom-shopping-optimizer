import { LoginView } from "@/components/auth/LoginView";

// Auth — Stitch "ng_nh_p". No nav bar (focused auth screen).
export default function LoginPage() {
  return (
    <main className="min-h-screen">
      <LoginView />
    </main>
  );
}
