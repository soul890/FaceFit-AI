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
    const occasion = formData.get("occasion") || "";

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

    // 1) K-Fashion 전문가 분석 (텍스트 JSON)
    const analysisPrompt = `You are a world-renowned K-Fashion designer and styling consultant (PhD in Fashion Design, 20+ years in Korean fashion industry). You have styled top Korean celebrities and understand Korean fashion trends deeply.

The user uploaded a full-body photo and described their occasion/situation: "${occasion}"

Analyze the person's current outfit, body proportions, skin tone, and overall style. Then provide a complete K-Fashion styling recommendation tailored to their occasion.

Tone: Like a warm, confident Korean fashion consultant at a premium styling studio in Cheongdam-dong. Be specific with colors, brands, and styling details.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "currentAnalysis": {
    "bodyType": "Body type assessment",
    "currentStyle": "Analysis of current outfit (2-3 sentences)",
    "colorTone": "Skin tone and which colors suit them",
    "strengths": "Body/style strengths to highlight (2-3 sentences)"
  },
  "occasion": {
    "type": "${occasion}",
    "dresscode": "Appropriate dress code for this occasion",
    "mood": "Target mood/impression to aim for"
  },
  "stylingGuide": {
    "top": {
      "item": "Recommended top item with specific details (color, material, fit)",
      "reason": "Why this works for their body and occasion"
    },
    "bottom": {
      "item": "Recommended bottom item with specific details",
      "reason": "Why this works"
    },
    "outer": {
      "item": "Recommended outerwear (if applicable)",
      "reason": "Why this works"
    },
    "shoes": {
      "item": "Recommended shoes with specific details",
      "reason": "Why this works"
    },
    "accessories": {
      "items": ["Accessory 1", "Accessory 2", "Accessory 3"],
      "reason": "How accessories complete the look"
    },
    "overallTip": "How to put it all together — overall styling tip (2-3 sentences)"
  },
  "colorPalette": {
    "main": "Main color recommendation",
    "accent": "Accent color",
    "avoid": "Colors to avoid and why"
  },
  "alternativeLooks": [
    { "name": "Look name", "description": "Complete outfit description", "vibe": "The mood/vibe of this look" },
    { "name": "Second option", "description": "Description", "vibe": "Vibe" }
  ],
  "brandRecommendations": [
    { "brand": "Korean fashion brand", "item": "Specific item recommendation", "priceRange": "Approximate price range", "reason": "Why this brand suits them" }
  ],
  "fashionDonts": ["What NOT to wear for this occasion 1", "Don't 2", "Don't 3"],
  "proTip": "A special insider K-Fashion tip from the stylist (2-3 sentences)"
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
        JSON.stringify({ error: "분석에 실패했습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Before & After 이미지 생성
    const guide = analysisResult.stylingGuide || {};
    const topItem = guide.top?.item || "";
    const bottomItem = guide.bottom?.item || "";
    const outerItem = guide.outer?.item || "";
    const shoesItem = guide.shoes?.item || "";
    const mainColor = analysisResult.colorPalette?.main || "";
    const accentColor = analysisResult.colorPalette?.accent || "";

    const imagePrompt = `너는 한국 최고의 K-Fashion 스타일리스트(20년 경력, 청담동 기반)이야.

업로드한 전신 사진을 기반으로 **Before & After** 이미지를 생성해줘.

**상황/TPO:** ${occasion}

**이미지 구성:**
- 왼쪽: "BEFORE" — 업로드한 사진과 동일한 현재 의상 모습. 원본과 최대한 동일하게 유지.
- 오른쪽: "AFTER" — K-Fashion 스타일링을 적용한 모습.

**AFTER 스타일링 적용 사항:**
- 상의: ${topItem}
- 하의: ${bottomItem}
- 아우터: ${outerItem}
- 신발: ${shoesItem}
- 메인 컬러: ${mainColor}, 포인트 컬러: ${accentColor}
- 전체적으로 한국 트렌디한 K-Fashion 느낌

**중요 규칙:**
- 얼굴, 체형, 헤어스타일은 절대 변경하지 마. 의상만 변경해.
- BEFORE와 AFTER가 동일 인물임이 확실히 보여야 해.
- 전신이 모두 보여야 해 (머리부터 발끝까지).
- 이미지 위에 왼쪽은 "BEFORE", 오른쪽은 "AFTER"를 표시해줘.
- 배경은 깔끔한 스튜디오 또는 세련된 도시 배경으로 해줘.`;

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

    let fashionImage = null;
    let fashionImageText = "";
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) fashionImage = part.inlineData.data;
          if (typeof part.text === "string") fashionImageText += part.text;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      fashionImage,
      fashionImageText,
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
