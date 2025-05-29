import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Metadata } from "next"

interface BundlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: BundlePageProps): Promise<Metadata> {
  const slug = params.slug
  
  const { data: bundle } = await supabaseAdmin\
    .from("
