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
    const lang = formData.get("lang") || "en";
    const langName = LANG_MAP[lang] || "English";

    const originalFile = formData.get("original");
    const skinBase64 = formData.get("skin") || "";
    const hairBase64 = formData.get("hair") || "";
    const dietBase64 = formData.get("diet") || "";
    const makeupBase64 = formData.get("makeup") || "";
    const fashionBase64 = formData.get("fashion") || "";

    // Build the parts array with all selected images
    const parts = [];

    const improvements = [];
    if (skinBase64) improvements.push("skin improvement");
    if (hairBase64) improvements.push("hairstyle change");
    if (dietBase64) improvements.push("weight/diet transformation");
    if (makeupBase64) improvements.push("K-beauty makeup");
    if (fashionBase64) improvements.push("K-fashion styling");

    const prompt = `너는 최고의 뷰티 & 스타일링 종합 전문가(박사)이야.

사용자가 여러 단계의 뷰티 변신 과정을 거쳤어. 아래 이미지들은 각 단계에서 선택한 최고의 결과물이야.

**변신 항목:** ${improvements.join(", ")}

**작업 지시:**
1. 첨부된 모든 개선 이미지들의 요소를 분석해줘 (피부, 헤어, 체형, 메이크업, 패션 등).
2. 이 모든 개선 요소를 하나로 합쳐서, "현재 모습(BEFORE)"과 "최종 변신 모습(AFTER)"을 나란히 보여주는 이미지를 생성해줘.
3. BEFORE는 원본 사진과 동일하게, AFTER는 모든 개선 사항이 적용된 최종 모습으로 생성해줘.
4. 왼쪽에 "BEFORE", 오른쪽에 "AFTER"를 표시해줘.
5. 동일 인물임이 확실히 보여야 해.
6. 배경은 세련된 스튜디오 느낌으로 통일해줘.

텍스트 응답은 ${langName}로 작성해줘:
- 각 변신 항목별 변화 설명
- 전체적인 변신 총평
- 따뜻한 응원 메시지`;

    parts.push({ text: prompt });

    // Add original photo if available
    if (originalFile && typeof originalFile !== 'string') {
      const arrayBuffer = await originalFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      parts.push({
        inlineData: {
          mimeType: originalFile.type || "image/jpeg",
          data: base64,
        },
      });
      parts.push({ text: "위 이미지는 원본(BEFORE) 사진입니다." });
    }

    // Add each selected improvement image
    if (skinBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: skinBase64 },
      });
      parts.push({ text: "위 이미지는 피부 개선 결과입니다." });
    }

    if (hairBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: hairBase64 },
      });
      parts.push({ text: "위 이미지는 헤어스타일 변경 결과입니다." });
    }

    if (dietBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: dietBase64 },
      });
      parts.push({ text: "위 이미지는 다이어트/체형 변환 결과입니다." });
    }

    if (makeupBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: makeupBase64 },
      });
      parts.push({ text: "위 이미지는 K-Beauty 메이크업 결과입니다." });
    }

    if (fashionBase64) {
      parts.push({
        inlineData: { mimeType: "image/png", data: fashionBase64 },
      });
      parts.push({ text: "위 이미지는 K-Fashion 스타일링 결과입니다." });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
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
    let finalImage = null;
    let textContent = "";

    const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
    for (const chunk of chunkArray) {
      const cparts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of cparts) {
        if (part.inlineData) finalImage = part.inlineData.data;
        if (typeof part.text === "string") textContent += part.text;
      }
    }

    // Split text into description and message
    const lines = textContent.split('\n').filter(l => l.trim());
    const msgIdx = lines.findIndex(l => l.includes('응원') || l.includes('메시지') || l.includes('motivation') || l.includes('message') || l.includes('Motivation'));
    let description = textContent;
    let message = "";
    if (msgIdx > 0) {
      description = lines.slice(0, msgIdx).join('\n');
      message = lines.slice(msgIdx).join('\n');
    }

    return new Response(JSON.stringify({ finalImage, description, message }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
