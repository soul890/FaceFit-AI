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
    const mode = formData.get("mode") || "ai";
    const occasion = formData.get("occasion") || "";

    // Handle clothes images for custom mode (top, bottom, outer)
    const clothesImages = [];
    const clothesLabels = [];
    async function processClothes(key, label) {
      const file = formData.get(key);
      if (file && mode === "custom") {
        const buf = await file.arrayBuffer();
        const b64 = btoa(new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ""));
        clothesImages.push({ data: b64, mime: file.type || "image/jpeg" });
        clothesLabels.push(label);
      }
    }
    await processClothes("clothesTop", "상의(Top)");
    await processClothes("clothesBottom", "하의(Bottom)");
    await processClothes("clothesOuter", "겉옷(Outer)");

    const isCustom = mode === "custom" && clothesImages.length > 0;

    // Step 1: Analysis (gemini-2.0-flash)
    const clothesDesc = clothesLabels.join(", ");
    const contextLine = isCustom
      ? `The user uploaded their full-body photo AND separate images of clothes they want to wear: ${clothesDesc}. Analyze how those clothes would look on this person as a coordinated outfit.`
      : `The user wants outfit recommendations for this occasion: "${occasion}".`;

    const analysisPrompt = `You are a world-class K-Fashion stylist and body proportion consultant.

User info: Height ${height}cm, Weight ${weight}kg.
${contextLine}

Analyze the person in the uploaded photo and provide a styling assessment.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "styleAnalysis": {
    "bodyFit": "How well ${isCustom ? 'these clothes fit' : 'the recommended style suits'} this body type — proportions, silhouette analysis (2-3 sentences)",
    "colorMatch": "Color compatibility with skin tone and overall harmony (2-3 sentences)",
    "silhouette": "How the outfit shapes the overall silhouette — what looks good, what to watch (2-3 sentences)"
  },
  "coordGuide": {
    "whyItWorks": "Why this outfit works for ${isCustom ? 'this person' : 'this occasion'} — detailed reasoning (2-3 sentences)",
    "stylingTip": "Specific styling tips to elevate the look — tucking, rolling, layering, etc. (2-3 sentences)"
  },
  "accessories": ["Recommended accessory 1", "Accessory 2", "Accessory 3", "Accessory 4"],
  "cautions": "Things to be careful about — avoid certain combos, fit issues, weather considerations, etc. (2-3 sentences)"
}`;

    const analysisParts = [
      { text: analysisPrompt },
      { inlineData: { mimeType, data: base64 } },
    ];
    if (isCustom) {
      for (const img of clothesImages) {
        analysisParts.push({ inlineData: { mimeType: img.mime, data: img.data } });
      }
    }

    const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const analysisResponse = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: analysisParts }],
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

    // Step 2: Generate styled image (gemini-3-pro-image-preview)
    const imagePrompt = isCustom
      ? `너는 한국 최고의 K-Fashion 스타일리스트야.

첫 번째 사진은 사용자의 전신 사진이고, 이후 사진들은 사용자가 입고 싶은 옷이야: ${clothesDesc}.
이 사람의 체형(키 ${height}cm, 몸무게 ${weight}kg)에 맞게 업로드한 옷들을 코디해서 입힌 전신 사진을 1장 생성해줘.

**중요 규칙:**
- 첫 번째 사진의 얼굴, 헤어스타일, 체형을 그대로 유지해
- 업로드한 옷들의 디자인, 색상, 패턴을 최대한 정확하게 반영해
- 상의/하의/겉옷이 각각 있으면 모두 조합해서 코디해
- 반드시 상체와 하체가 모두 보이는 전신 사진 (머리 꼭대기부터 신발까지 프레임 안에 포함)
- 전문 패션 포토그래퍼가 촬영한 듯한 로우앵글(low-angle) 구도 — 카메라를 허리~무릎 높이에서 약간 위를 올려다보며 촬영하여 다리가 길고 키가 커 보이는 비율로 연출
- 세련된 스튜디오 또는 도시 배경
- 1장의 전신 포트레이트만 생성. 그리드/콜라주/Before-After 금지`
      : `너는 한국 최고의 K-Fashion 스타일리스트야.

이 사람(키 ${height}cm, 몸무게 ${weight}kg)에게 "${occasion}" 상황에 맞는 K-Fashion 코디를 적용한 전신 사진 1장을 생성해줘.

**중요 규칙:**
- 업로드한 사진의 얼굴, 헤어스타일을 그대로 유지해
- 체형에 잘 맞는 한국 트렌디 스타일 의상을 입혀줘
- 반드시 상체와 하체가 모두 보이는 전신 사진 (머리 꼭대기부터 신발까지 프레임 안에 포함)
- 전문 패션 포토그래퍼가 촬영한 듯한 로우앵글(low-angle) 구도 — 카메라를 허리~무릎 높이에서 약간 위를 올려다보며 촬영하여 다리가 길고 키가 커 보이는 비율로 연출
- 세련된 스튜디오 또는 도시 배경
- 1장의 전신 포트레이트만 생성. 그리드/콜라주/Before-After 금지`;

    const imageParts = [
      { text: imagePrompt },
      { inlineData: { mimeType, data: base64 } },
    ];
    if (isCustom) {
      for (const img of clothesImages) {
        imageParts.push({ inlineData: { mimeType: img.mime, data: img.data } });
      }
    }

    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

    const imageResponse = await fetch(imageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: imageParts }],
        generationConfig: {
          temperature: 1,
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { imageSize: "1K" },
        },
        tools: [{ googleSearch: {} }],
      }),
    });

    let fashionImage = null;
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) fashionImage = part.inlineData.data;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      fashionImage,
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
