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

    // 1) K-Beauty 메이크업 전문가 분석 (텍스트 JSON)
    const analysisPrompt = `You are a world-renowned K-Beauty makeup artist (20+ years of experience) who has worked with top Korean celebrities. You specialize in analyzing skin tones (warm/cool/neutral) and recommending personalized Korean makeup techniques.

Analyze the person's face in the uploaded photo — their skin tone (undertone), face shape, eye shape, lip shape, and overall features — then provide a complete K-Beauty makeup recommendation.

Tone: Like a warm, friendly Korean makeup artist giving a personal consultation at a high-end beauty studio in Gangnam.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "skinToneAnalysis": {
    "undertone": "Warm / Cool / Neutral",
    "season": "Personal color season (e.g., Spring Warm, Summer Cool, Autumn Warm, Winter Cool)",
    "description": "Detailed skin tone analysis (2-3 sentences)"
  },
  "faceAnalysis": {
    "faceShape": "Face shape type",
    "eyeShape": "Eye shape type",
    "lipShape": "Lip shape type",
    "strengths": "Facial feature strengths to highlight (2-3 sentences)"
  },
  "makeupGuide": {
    "base": {
      "foundation": "Recommended foundation shade and type",
      "primer": "Primer recommendation",
      "concealer": "Concealer tips",
      "setting": "Setting powder/spray recommendation",
      "tip": "K-beauty base makeup tip (2-3 sentences)"
    },
    "eye": {
      "eyeshadow": "Recommended eyeshadow palette colors and placement",
      "eyeliner": "Eyeliner style and technique",
      "mascara": "Mascara recommendation",
      "eyebrow": "Eyebrow shape and product recommendation",
      "tip": "K-beauty eye makeup tip (2-3 sentences)"
    },
    "lip": {
      "color": "Recommended lip colors (2-3 options)",
      "technique": "Application technique (e.g., gradient lip, full lip)",
      "product": "Product type recommendation (tint, matte, gloss)",
      "tip": "K-beauty lip tip (2-3 sentences)"
    },
    "cheek": {
      "blush": "Blush color and placement",
      "contour": "Contouring guide for face shape",
      "highlight": "Highlighter placement",
      "tip": "K-beauty cheek tip (2-3 sentences)"
    }
  },
  "looks": [
    { "name": "Look name (e.g., Daily Natural)", "description": "Brief description of the complete look", "occasion": "When to wear" },
    { "name": "Second look", "description": "Description", "occasion": "Occasion" },
    { "name": "Third look", "description": "Description", "occasion": "Occasion" }
  ],
  "productRecommendations": [
    { "category": "Category (e.g., Foundation)", "brand": "Korean brand name", "product": "Product name", "reason": "Why it suits this person" }
  ],
  "proTip": "A special pro tip from the K-beauty artist (2-3 sentences)"
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
    const bestLook = analysisResult.looks?.[0]?.name || "Natural K-Beauty";
    const lipColor = analysisResult.makeupGuide?.lip?.color || "";
    const eyeshadow = analysisResult.makeupGuide?.eye?.eyeshadow || "";
    const blush = analysisResult.makeupGuide?.cheek?.blush || "";

    const imagePrompt = `너는 한국 최고의 K-Beauty 메이크업 아티스트(20년 경력)이야.

업로드한 사진을 기반으로 **Before & After** 이미지를 생성해줘.

**이미지 구성:**
- 왼쪽: "BEFORE" — 업로드한 사진과 동일한 민낯(노메이크업) 얼굴. 원본과 최대한 동일하게 유지.
- 오른쪽: "AFTER" — K-Beauty 풀 메이크업을 적용한 모습.

**AFTER 메이크업 적용 사항:**
- 피부: 촉촉한 광채 베이스, 자연스러운 톤보정, 피부결 보정
- 눈: ${eyeshadow}, 자연스러운 아이라인, 속눈썹 강조
- 입술: ${lipColor}, 한국식 그라데이션 립
- 볼: ${blush}, 자연스러운 혈색
- 전체적으로 "${bestLook}" 느낌의 K-Beauty 메이크업

**중요 규칙:**
- 얼굴 형태, 눈코입 위치, 헤어스타일은 절대 변경하지 마.
- BEFORE와 AFTER의 얼굴이 동일 인물임이 확실히 보여야 해.
- 이미지 위에 왼쪽은 "BEFORE", 오른쪽은 "AFTER"를 표시해줘.
- 배경은 따뜻한 실내 조명의 자연스러운 분위기로 통일해줘.`;

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
    let makeupImageText = "";
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) makeupImage = part.inlineData.data;
          if (typeof part.text === "string") makeupImageText += part.text;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      makeupImage,
      makeupImageText,
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
