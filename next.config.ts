import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

if (process.env.VERCEL) {
  console.log(
    `[security-readiness] service-role=${process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? "configured" : "missing"}`,
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withNextIntl(nextConfig);
