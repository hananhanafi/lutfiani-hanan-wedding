import { Suspense } from "react";

export default function EnterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
