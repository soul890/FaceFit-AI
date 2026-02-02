const LANG_MAP = { ko: "Korean", en: "English", ja: "Japanese", zh: "Chinese", hi: "Hindi", de: "German", fr: "French", ru: "Russian", mn: "Mongolian", tr: "Turkish", fa: "Persian (Farsi)" };

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "Missing image" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const mimeType = imageFile.type || "image/jpeg";
    const lang = formData.get("lang") || "en";
    const langName = LANG_MAP[lang] || "English";

    const height = formData.get("height") || "";
    const weight = formData.get("weight") || "";
    const goalType = formData.get("goalType") || "diet";
    const goalWeight = formData.get("goalWeight") || "";

    const goalLabel = goalType === "bulk" ? "bulk up (muscle gain)" : "diet (weight loss)";

    // Step 1: Analysis with gemini-2.0-flash
    const analysisPrompt = `You are a world-class fitness trainer (PhD in Exercise Science), certified nutritionist (PhD in Clinical Nutrition), and body composition specialist.

The user's info: Height ${height}cm, Weight ${weight}kg, Goal: ${goalLabel}, Target weight: ${goalWeight}kg.

Analyze the person in the uploaded photo along with the provided body measurements to create a comprehensive body plan.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "bodyAnalysis": {
    "bmi": "Calculated BMI value (e.g. 24.2)",
    "bodyType": "Body type (e.g. Endomorph, Mesomorph, Ectomorph)",
    "strategy": "Goal achievement strategy summary (2-3 sentences)"
  },
  "management": {
    "exerciseRoutine": "Recommended exercise routine with specific schedule and exercises (3-4 sentences)",
    "lifestyle": "Lifestyle and habit advice for reaching the goal (2-3 sentences)"
  },
  "mealPlan": {
    "dailyCalories": "Recommended daily calorie intake number",
    "meals": [
      { "type": "Breakfast", "menu": "Specific menu with portions", "calories": "kcal amount", "reason": "Why this meal helps the goal" },
      { "type": "Lunch", "menu": "Specific menu with portions", "calories": "kcal amount", "reason": "Why this meal helps the goal" },
      { "type": "Dinner", "menu": "Specific menu with portions", "calories": "kcal amount", "reason": "Why this meal helps the goal" },
      { "type": "Snack", "menu": "Healthy snack option", "calories": "kcal amount", "reason": "Why this snack helps" }
    ]
  },
  "keyNutrients": ["Nutrient 1", "Nutrient 2", "Nutrient 3", "Nutrient 4", "Nutrient 5"],
  "disclaimer": "This is AI-generated informational content only. Consult a healthcare professional before starting any diet or exercise program."
}`;

    const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const analysisResponse = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    let analysisResult = null;
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      const parts = analysisData.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p) => typeof p.text === "string").map((p) => p.text).join("");
      if (text) {
        const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { analysisResult = JSON.parse(jsonMatch[0]); } catch {}
        }
      }
    }

    if (!analysisResult) {
      return new Response(
        JSON.stringify({ error: "Analysis failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Generate target body image with gemini-3-pro-image-preview
    const imagePrompt = `Generate a single full-body photo of this person at their goal weight of ${goalWeight}kg (currently ${weight}kg, height ${height}cm, goal: ${goalLabel}).

Requirements:
- Keep the same face identity from the uploaded photo
- Show the person in athletic/workout clothing
- Apply a flattering hairstyle that suits their face
- Show improved, healthy-looking skin
- Warm indoor studio lighting
- The body should realistically reflect ${goalWeight}kg at ${height}cm height
- Single full-body portrait photo, not a grid or collage
- Professional fitness photo style`;

    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    const imageResponse = await fetch(imageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: imagePrompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { imageSize: "1K" },
        },
        tools: [{ googleSearch: {} }],
      }),
    });

    let bodyImage = null;
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) bodyImage = part.inlineData.data;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      bodyImage,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
