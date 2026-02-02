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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    // 1) 이미지 생성: 3x3 그리드 헤어스타일
    const imagePrompt = `너는 최고의 피부과전문가(박사), 헤어스타일전문가(박사)이야. 업로드한 사진속 사람의 얼굴형, 이목구비, 나이대, 머리카락 질감, 피부톤을 정밀하게 분석한 후, 이 사람에게 가장 잘 어울리는 헤어스타일 10개를 5*2 그리드로 생성해줘.

[핵심 원칙]
- AI로서 전문가의 시각으로 이 사람에게 가장 어울리는 스타일을 자유롭게 추천해줘
- 단, 10개 스타일은 반드시 서로 확연히 다른 길이, 질감, 실루엣이어야 해 (숏/미디엄/롱, 스트레이트/웨이브/컬, 업스타일/다운스타일 등 다양하게 섞어줘)
- 같은 느낌의 스타일이 2개 이상 반복되면 안 돼. 한눈에 봤을 때 10개가 각각 완전히 다른 스타일로 보여야 해

각 이미지 요구사항:
- 첨부한 사람의 얼굴과 형태는 절대로 변형하지 말고 생성해줘
- 피부도 함께 개선된 모습으로 생성해줘
- 각 이미지의 배경은 따뜻한 실내 조명의 자연스러운 분위기로 해줘
- 각 이미지마다 정면, 살짝 왼쪽, 살짝 오른쪽 등 다양한 얼굴 각도로 자연스럽게 표현해줘

각 이미지 하단에 반드시 영어로 다음 정보를 텍스트로 표시해줘:
1. 헤어스타일 이름 (굵은 글씨, 예: "Textured Pixie Cut.")
2. 피부 개선 설명 (이탤릭, *로 감싸서, 예: "*Revitalized skin with boosted collagen, showing youthful glow and texture.*")

IMPORTANT: Write all text overlay on images in English. The 10 styles MUST look visually distinct — vary the length, texture, silhouette, and overall vibe dramatically across all 10.`;

    const geminiResponse = await fetch(geminiUrl, {
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

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: err }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const chunks = await geminiResponse.json();
    let imageBase64 = null;
    let textContent = "";
    const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
    for (const chunk of chunkArray) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) imageBase64 = part.inlineData.data;
        if (typeof part.text === "string") textContent += part.text;
      }
    }

    // 2) 텍스트 분석: 9가지 헤어스타일별 상세 분석 JSON
    let analysisResult = null;
    try {
      const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const analysisPrompt = `You are a world-class hair stylist and face shape analyst with PhD-level expertise in aesthetics, facial structure analysis, and fashion psychology.

Based on the uploaded photo, analyze this person's face shape, facial features, skin tone, and overall impression. Then provide detailed analysis for 10 hairstyles that best suit this person.

For each hairstyle, provide a compelling, scientific, and practical reason WHY it suits this person — considering:
- Face shape compatibility (e.g., oval, round, square, heart-shaped)
- Facial feature balance (forehead, jawline, cheekbones)
- Overall impression & vibe (e.g., urban, elegant, youthful, professional)
- Statistical/trend-based reasoning (e.g., "Statistically, people with high cheekbones look best with layered cuts")
- Emotional/psychological impact (e.g., "This style softens the jawline, giving a more approachable impression")

Respond ONLY in ${langName} with the following JSON (no other text). All values must be in ${langName}:
{
  "faceAnalysis": {
    "faceShape": "Face shape in ${langName}",
    "features": "Key facial features summary in ${langName} (2 sentences)",
    "skinTone": "Skin tone description in ${langName}"
  },
  "styles": [
    {
      "name": "Hairstyle name in ${langName}",
      "reason": "Detailed reason why this suits the person in ${langName} (3-4 sentences covering face shape, impression, trend)"
    }
  ]
}

Provide exactly 10 styles in the array.`;

      const analysisResponse = await fetch(analysisUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

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
    } catch {}

    return new Response(JSON.stringify({ imageBase64, textContent, analysis: analysisResult }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
