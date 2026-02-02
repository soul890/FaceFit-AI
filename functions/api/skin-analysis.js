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
    const analysisPrompt = `You are an AI Beauty Style Coach with extensive knowledge of beauty trends and skincare routines.

Analyze the skin condition of the person in the uploaded photo.

Tone: Professional yet warm, like a friendly beauty consultant giving a 1-on-1 consultation. Empathize with concerns and focus on positive potential for improvement.

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
  "disclaimer": "이 결과는 의료 진단이 아닌 AI 뷰티 스타일링 참고 정보입니다. (in ${langName})"
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

    return new Response(JSON.stringify(analysisResult), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
