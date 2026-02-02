const LANG_MAP = { ko: "Korean", en: "English", ja: "Japanese", zh: "Chinese", hi: "Hindi", de: "German", fr: "French", ru: "Russian", mn: "Mongolian", tr: "Turkish", fa: "Persian (Farsi)" };

const STYLE_PROMPTS = {
  "glow-natural": "Glow Natural: dewy, hydrated skin with minimal makeup. Soft brown tones, natural lip tint, subtle highlighter. Daily casual look.",
  "cool-pure": "Cool-tone Pure: clean blue/pink-based makeup. Light lavender or pink eyeshadow, MLBB pink lip, porcelain-like base. Innocent and fresh.",
  "warm-coral": "Warm Coral: warm coral/peach tones throughout. Coral eyeshadow, coral-pink blush, coral lip tint. Bright and youthful.",
  "smoky-chic": "Smoky Chic: urban sophisticated smoky eyes. Dark brown/charcoal gradient eyeshadow, sharp liner, nude-mauve lip. City-cool vibe.",
  "rose-glam": "Rosé Glam: glamorous rose/berry tones. Rose-gold shimmer eye, berry-toned lips, luminous pink blush. Elegant evening look.",
  "dewy-glass": "Dewy Glass Skin: ultra-dewy transparent makeup. Glass-skin base, sheer wash of color, glossy lip, water-drop highlight. K-beauty signature.",
  "retro-mood": "Retro Mood: vintage-inspired look. Warm brown/orange eye tones, bold red or brick lip as focal point, matte base. 70s-90s nostalgia.",
  "y2k-pop": "Y2K Pop: trendy glitter and color pop. Sparkle/glitter on eyes or cheeks, playful color eyeliner, glossy fruit-toned lip. Gen-Z fun.",
  "wedding-elegance": "Wedding Elegance: formal special-occasion look. Flawless long-lasting base, champagne shimmer eyes, elegant rosy lip, sculpted contour. Timeless grace.",
};

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
    const styleId = formData.get("styleId") || "glow-natural";
    const styleDesc = STYLE_PROMPTS[styleId] || STYLE_PROMPTS["glow-natural"];
    const customDesc = formData.get("customDesc") || "";

    const customLine = customDesc ? `\nAdditional user request: "${customDesc}"` : "";

    // Step 1: Analysis with gemini-2.0-flash
    const analysisPrompt = `You are a world-renowned K-Beauty makeup artist (20+ years experience) who has worked with top Korean celebrities.

The user wants this makeup style: "${styleDesc}"${customLine}

Analyze the person's face in the uploaded photo — skin tone, undertone, face shape, eye shape — then provide a K-Beauty makeup recommendation tailored to the selected style.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "skinToneAnalysis": {
    "undertone": "Warm / Cool / Neutral",
    "season": "Personal color season (e.g., Spring Warm, Summer Cool)",
    "description": "How this style works with their skin tone (2-3 sentences)"
  },
  "makeupGuide": {
    "base": {
      "foundation": "Foundation shade and type for this look",
      "tip": "Base makeup technique for this style (2-3 sentences)"
    },
    "eye": {
      "eyeshadow": "Eyeshadow colors and placement for this style",
      "tip": "Eye makeup technique (2-3 sentences)"
    },
    "lip": {
      "color": "Lip color recommendation for this style",
      "tip": "Lip technique (2-3 sentences)"
    },
    "cheek": {
      "blush": "Blush color and placement",
      "tip": "Cheek technique (2-3 sentences)"
    }
  },
  "productRecommendations": [
    { "category": "Category", "brand": "Korean brand", "product": "Product name", "reason": "Why it suits" },
    { "category": "Category", "brand": "Korean brand", "product": "Product name", "reason": "Why it suits" },
    { "category": "Category", "brand": "Korean brand", "product": "Product name", "reason": "Why it suits" }
  ],
  "proTip": "A special pro tip for achieving this look perfectly (2-3 sentences)"
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

    // Step 2: Generate makeup result image with gemini-3-pro-image-preview
    const lipColor = analysisResult.makeupGuide?.lip?.color || "";
    const eyeshadow = analysisResult.makeupGuide?.eye?.eyeshadow || "";
    const blush = analysisResult.makeupGuide?.cheek?.blush || "";

    const imagePrompt = `너는 한국 최고의 K-Beauty 메이크업 아티스트(20년 경력)이야.

업로드한 사진의 사람에게 다음 메이크업을 적용해줘.

메이크업 컨셉: ${styleDesc}
${customDesc ? `추가 요청: ${customDesc}` : ""}

적용할 메이크업:
- 아이 메이크업: ${eyeshadow}
- 립 컬러: ${lipColor}
- 치크 컬러: ${blush}

**중요 규칙:**
- 업로드한 사진과 동일한 사람의 얼굴 특징(눈, 코, 입, 얼굴형)을 유지해
- 헤어스타일도 동일하게 유지해
- 메이크업만 자연스럽게 적용해. 프로 메이크업 아티스트가 직접 한 것처럼.
- 따뜻한 뷰티 스튜디오 조명
- 1장의 클로즈업~미드샷 포트레이트만 생성해
- 그리드나 Before/After 비교 이미지는 절대 만들지 마`;

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

    let makeupImage = null;
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) makeupImage = part.inlineData.data;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      makeupImage,
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
