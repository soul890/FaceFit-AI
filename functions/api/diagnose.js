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
    const height = formData.get("height");
    const weight = formData.get("weight");
    const imageFile = formData.get("image");

    if (!imageFile || !height || !weight) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    const prompt = `당신은 전문 피부 분석가입니다. 이 사진을 분석하여 피부 상태를 진단하세요.

사용자 정보: 키 ${height}cm, 몸무게 ${weight}kg

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 순수 JSON만):
{
  "overallScore": 0-100 사이 정수,
  "skinType": "피부타입 (지성/건성/복합성/중성)",
  "analysis": {
    "moisture": { "score": 0-100, "description": "수분도 분석 설명" },
    "trouble": { "score": 0-100, "description": "트러블 분석 설명" },
    "pore": { "score": 0-100, "description": "모공 분석 설명" },
    "wrinkle": { "score": 0-100, "description": "주름 분석 설명" },
    "tone": { "score": 0-100, "description": "피부톤 분석 설명" }
  },
  "recommendations": ["추천 케어 1", "추천 케어 2", "추천 케어 3"]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: err }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const text =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis", raw: text }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
