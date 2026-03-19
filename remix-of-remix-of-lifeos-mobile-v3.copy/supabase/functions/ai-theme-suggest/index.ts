import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (type === "palette") {
      systemPrompt = `You are a professional UI/UX designer specializing in color theory and design systems.
Generate a cohesive color palette for a productivity/life management app based on the user's description.
All colors MUST be in HSL format: "H S% L%" (e.g., "250 95% 60%").
Consider accessibility, contrast ratios, and visual harmony.
Generate both light and dark mode variants.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_theme_palette",
          description: "Generate a complete color palette with light and dark mode",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Theme name" },
              description: { type: "string", description: "Brief description of the theme style" },
              light: {
                type: "object",
                properties: {
                  background: { type: "string", description: "HSL: Main background color" },
                  foreground: { type: "string", description: "HSL: Main text color" },
                  card: { type: "string", description: "HSL: Card background" },
                  cardForeground: { type: "string", description: "HSL: Card text color" },
                  primary: { type: "string", description: "HSL: Primary brand color" },
                  primaryForeground: { type: "string", description: "HSL: Text on primary" },
                  secondary: { type: "string", description: "HSL: Secondary color" },
                  secondaryForeground: { type: "string", description: "HSL: Text on secondary" },
                  muted: { type: "string", description: "HSL: Muted background" },
                  mutedForeground: { type: "string", description: "HSL: Muted text" },
                  accent: { type: "string", description: "HSL: Accent color" },
                  accentForeground: { type: "string", description: "HSL: Text on accent" },
                  destructive: { type: "string", description: "HSL: Error/danger color" },
                  destructiveForeground: { type: "string", description: "HSL: Text on destructive" },
                  border: { type: "string", description: "HSL: Border color" },
                  ring: { type: "string", description: "HSL: Focus ring color" },
                },
                required: ["background", "foreground", "primary", "primaryForeground", "secondary", "accent", "destructive", "border"]
              },
              dark: {
                type: "object",
                properties: {
                  background: { type: "string" },
                  foreground: { type: "string" },
                  card: { type: "string" },
                  cardForeground: { type: "string" },
                  primary: { type: "string" },
                  primaryForeground: { type: "string" },
                  secondary: { type: "string" },
                  secondaryForeground: { type: "string" },
                  muted: { type: "string" },
                  mutedForeground: { type: "string" },
                  accent: { type: "string" },
                  accentForeground: { type: "string" },
                  destructive: { type: "string" },
                  destructiveForeground: { type: "string" },
                  border: { type: "string" },
                  ring: { type: "string" },
                },
                required: ["background", "foreground", "primary", "primaryForeground", "secondary", "accent", "destructive", "border"]
              },
              fonts: {
                type: "object",
                properties: {
                  heading: { type: "string", description: "Google Font name for headings" },
                  body: { type: "string", description: "Google Font name for body text" },
                },
              },
            },
            required: ["name", "description", "light", "dark"],
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_theme_palette" } };
    } else if (type === "improve") {
      systemPrompt = `You are a professional UI/UX designer. Analyze the given color palette and suggest improvements for better accessibility, visual harmony, and modern aesthetics.
All colors MUST be in HSL format: "H S% L%".`;

      tools = [{
        type: "function",
        function: {
          name: "improve_palette",
          description: "Suggest improvements for the color palette",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    colorKey: { type: "string" },
                    currentValue: { type: "string" },
                    suggestedValue: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["colorKey", "suggestedValue", "reason"],
                },
              },
              overallFeedback: { type: "string" },
            },
            required: ["suggestions", "overallFeedback"],
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "improve_palette" } };
    } else {
      // Generate multiple theme ideas
      systemPrompt = `You are a creative UI/UX designer. Generate 3-5 unique theme ideas for a productivity app based on the user's input.
Each theme should have a distinct personality and use case.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_theme_ideas",
          description: "Generate multiple theme concept ideas",
          parameters: {
            type: "object",
            properties: {
              ideas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    mood: { type: "string" },
                    primaryColor: { type: "string", description: "HSL format" },
                    accentColor: { type: "string", description: "HSL format" },
                  },
                  required: ["name", "description", "mood", "primaryColor", "accentColor"],
                },
              },
            },
            required: ["ideas"],
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "generate_theme_ideas" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt || "Create a modern, professional theme" },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
