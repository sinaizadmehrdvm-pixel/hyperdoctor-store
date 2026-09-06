import type { Metadata } from "next";

/**
 * Transactional and account surfaces are useful to customers but must never
 * become search-result landing pages or inherit the public homepage canonical.
 */
export const privateRouteMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};
