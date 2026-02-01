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

    const prompt = `너는 최고의 피부과전문가(박사), 헤어스타일전문가(박사)이야. 업로드한 사진을 토대로 3*3그리드로 피부가 개선된 모습과, 어떤 헤어스타일인지 설명과 함께 첨부한 사진속 사람이랑 최고로 잘 어울리는 헤어스타일을 9개 생성해주고, 단, 첨부한 사람의 얼굴과 형태는 절대로 변형하지 말고 생성해줘. 각 이미지의 배경은 따뜻한 실내 조명의 자연스러운 분위기로 해줘. 각 이미지마다 정면, 살짝 왼쪽, 살짝 오른쪽 등 다양한 얼굴 각도로 자연스럽게 표현해줘. 이미지 안에 표시하는 헤어스타일 이름과 설명은 반드시 영어로 작성해줘.

IMPORTANT: Write all text responses in ${langName}.`;

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
          temperature: 1,
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            imageSize: "1K",
          },
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

    // streamGenerateContent returns an array of chunks
    const chunks = await geminiResponse.json();

    let imageBase64 = null;
    let textContent = "";

    const chunkArray = Array.isArray(chunks) ? chunks : [chunks];

    for (const chunk of chunkArray) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
        }
        if (typeof part.text === "string") {
          textContent += part.text;
        }
      }
    }

    return new Response(JSON.stringify({ imageBase64, textContent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
