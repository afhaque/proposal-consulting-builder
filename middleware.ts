import { NextResponse } from "next/server";

// Auth bypassed — no GitHub OAuth credentials configured.
// ProposalCraft is open-access; authentication can be re-enabled
// by restoring: export { auth as middleware } from "@/auth"
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
