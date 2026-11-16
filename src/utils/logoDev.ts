/**
 * Logo URLs from logo.dev. Only a brand's public domain is sent — never a
 * transaction name, amount or anything about the user.
 *
 * Needs a publishable key in `EXPO_PUBLIC_LOGO_DEV_TOKEN` (`pk_…`). Without
 * one this returns undefined and the well draws its Lucide fallback.
 */
export function logoDevUrl(domain: string | null | undefined, sizePx = 80): string | undefined {
  const token = process.env.EXPO_PUBLIC_LOGO_DEV_TOKEN;
  if (!domain || !token) return undefined;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=${sizePx}&format=png&retina=true`;
}
