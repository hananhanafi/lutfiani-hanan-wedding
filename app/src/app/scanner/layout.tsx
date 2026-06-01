import ForceLightMode from "./ForceLightMode";

export const metadata = { title: "Guest Scanner" };

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <ForceLightMode>{children}</ForceLightMode>;
}
