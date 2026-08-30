import { supabase } from '../lib/supabase';
import { fromSupabaseError, type Result, type SupabaseError } from '../utils/result';

/** One curated brand row from `public.merchant_logos`. */
export interface MerchantLogo {
  keyword: string;
  label: string;
  /** Null for a brand listed only for its category — it shows no logo. */
  domain: string | null;
  /** Object path in the public `merchant-logos` bucket, when a file was uploaded. */
  logo_path?: string | null;
  /** Explicit logo URL, overriding the domain-derived one. */
  logo_url?: string | null;
  /** Expense category id to preselect when this merchant is recognised. */
  category?: string | null;
}

export const merchantLogosRepository = {
  async fetchAll(): Promise<Result<MerchantLogo[], SupabaseError>> {
    const { data, error } = await supabase
      .from('merchant_logos')
      .select('keyword, label, domain, category, logo_path, logo_url')
      .eq('is_active', true);
    if (error) return { ok: false, error: fromSupabaseError(error) };
    return { ok: true, data: data as MerchantLogo[] };
  },

  /** Public URL for an uploaded logo file — the bucket is public, so no signing. */
  publicUrl(path: string): string {
    return supabase.storage.from('merchant-logos').getPublicUrl(path).data.publicUrl;
  },
};
