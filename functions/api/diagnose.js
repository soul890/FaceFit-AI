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

    // 1) 피부 분석 (텍스트 JSON)
    const analysisPrompt = `You are an AI Skin Expert Coach with extensive knowledge of dermatology, clinical nutrition, and the latest scientific research.

Analyze the skin health of the person in the uploaded photo.

Tone: Professional yet warm, like a university hospital professor giving a 1-on-1 consultation. Empathize with concerns and focus on positive potential for improvement.

Respond ONLY in ${langName} language with the following JSON format (no other text). All description values must be in ${langName}:
{
  "overallScore": integer between 0-100,
  "skinType": "Skin type in ${langName}",
  "analysis": {
    "moisture": { "score": 0-100, "label": "Moisture label in ${langName}", "description": "Professional and warm analysis in ${langName} (2-3 sentences)" },
    "trouble": { "score": 0-100, "label": "Trouble label in ${langName}", "description": "Professional and warm analysis in ${langName} (2-3 sentences)" },
    "pore": { "score": 0-100, "label": "Pores label in ${langName}", "description": "Professional and warm analysis in ${langName} (2-3 sentences)" },
    "wrinkle": { "score": 0-100, "label": "Wrinkles label in ${langName}", "description": "Professional and warm analysis in ${langName} (2-3 sentences)" },
    "tone": { "score": 0-100, "label": "Skin Tone label in ${langName}", "description": "Professional and warm analysis in ${langName} (2-3 sentences)" }
  },
  "recommendations": ["Care recommendation in ${langName} 1", "2", "3", "4", "5"],
  "diet": {
    "summary": "Diet recommendation summary in ${langName} (2-3 sentences)",
    "meals": [
      { "type": "Breakfast in ${langName}", "menu": "Specific menu in ${langName}", "reason": "Why this helps in ${langName}" },
      { "type": "Lunch in ${langName}", "menu": "Specific menu in ${langName}", "reason": "Reason in ${langName}" },
      { "type": "Dinner in ${langName}", "menu": "Specific menu in ${langName}", "reason": "Reason in ${langName}" }
    ],
    "nutrients": ["Key nutrient in ${langName} 1", "Nutrient 2", "Nutrient 3"]
  },
  "disclaimer": "Disclaimer message in ${langName}"
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
          maxOutputTokens: 2048,
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
        JSON.stringify({ error: "피부 분석에 실패했습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) 피부 개선 과정 3x3 그리드 이미지 생성
    let skinImageBase64 = null;
    let skinImageText = "";
    try {
      const imagePrompt = `너는 최고의 피부과전문가(박사)이야. 업로드한 사진을 토대로 3*3그리드로 피부가 단계별로 개선되는 과정을 보여줘. 1단계(현재)부터 9단계(최종 완벽한 피부)까지 순차적으로 피부가 점점 좋아지는 모습을 생성해줘. 각 단계마다 어떤 개선이 이루어졌는지 ${langName}로 간단히 설명을 표시해줘. 단, 첨부한 사람의 얼굴과 형태는 절대로 변형하지 말고 생성해줘. 각 이미지의 배경은 따뜻한 실내 조명의 자연스러운 분위기로 해줘.`;

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

      if (imageResponse.ok) {
        const chunks = await imageResponse.json();
        const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
        for (const chunk of chunkArray) {
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) skinImageBase64 = part.inlineData.data;
            if (typeof part.text === "string") skinImageText += part.text;
          }
        }
      }
    } catch {}


    return new Response(JSON.stringify({
      ...analysisResult,
      skinImage: skinImageBase64,
      skinImageText,
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
