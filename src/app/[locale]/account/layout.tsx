import { privateRouteMetadata } from "@/lib/private-route-metadata";

export const metadata = privateRouteMetadata;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
