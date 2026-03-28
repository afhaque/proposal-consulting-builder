import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "./components/Header";
import ProposalBuilder from "./components/ProposalBuilder";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <ProposalBuilder />
    </div>
  );
}
