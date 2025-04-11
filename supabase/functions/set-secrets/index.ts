import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Set the secrets
    await Deno.env.set("YELP_API_KEY", "iYwFjiwmMDv08lJz8H_Dvsxx93H81MYLGkexEMvxH8J60I1pxc5GpyzTZyaO6xDtQ-jlAIJaC6ujscO6rHTbq8wgpge_bUuz2nQa0VpcLU5ikY2mBWw8AfVfiDMoZ3Yx");
    await Deno.env.set("TICKETMASTER_API_KEY", "DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9");
    await Deno.env.set("TICKETMASTER_SECRET", "H1dYvpxiiaTgJow5");
    await Deno.env.set("EVENTBRITE_API_KEY", "YJH4KGIHRNHOKODPZD");
    await Deno.env.set("EVENTBRITE_CLIENT_SECRET", "QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ");
    await Deno.env.set("EVENTBRITE_PRIVATE_TOKEN", "EUB5KUFLJH2SKVCHVD3E");
    await Deno.env.set("EVENTBRITE_PUBLIC_TOKEN", "C4WQAR3XB7XX2AYOUEQ4");
    await Deno.env.set("MAPBOX_API_KEY", "pk.eyJ1IjoidHJhcHBhdCIsImEiOiJjbTMzODBqYTYxbHcwMmpwdXpxeWljNXJ3In0.xKUEW2C1kjFBu7kr7Uxfow");
    await Deno.env.set("TOMTOM_API_KEY", "L6x6moNiYg0RSomE2RmDEqS8KW1pFBKz");
    await Deno.env.set("OPENROUTER_API_KEY", "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");

    return new Response(
      JSON.stringify({ message: "Secrets set successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error setting secrets:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})