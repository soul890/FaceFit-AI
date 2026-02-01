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

    // 1) 헬스 트레이너 + 영양학 전문가 분석 (텍스트 JSON)
    const analysisPrompt = `You are a world-class fitness trainer (PhD in Exercise Science), certified nutritionist (PhD in Clinical Nutrition), and body composition specialist with 20+ years of experience coaching transformations.

The user provided their body info: Height ${height}cm, Weight ${weight}kg.
Use this actual data (not estimation) for BMI calculation, calorie needs, and optimal weight recommendation.

Analyze the person's face in the uploaded photo along with the provided body measurements to create a comprehensive fitness & diet coaching plan.

Tone: Professional yet motivating, like a top personal trainer giving a premium 1-on-1 consultation. Be encouraging and specific.

Respond ONLY in ${langName} language with the following JSON format (no other text). All text values must be in ${langName}:
{
  "currentAnalysis": {
    "estimatedWeight": "User's actual weight (use the provided value)",
    "bodyType": "Body type assessment (e.g., Endomorph, Mesomorph, Ectomorph)",
    "facialAnalysis": "What the facial features suggest about current body composition (2-3 sentences)"
  },
  "goal": {
    "optimalWeight": "Optimal weight in kg",
    "weightToLose": "Amount to lose in kg",
    "estimatedDuration": "Realistic timeframe (e.g., 3-4 months)",
    "summary": "Goal summary (2-3 sentences)"
  },
  "mealPlan": {
    "dailyCalories": "Recommended daily calorie intake",
    "macroRatio": "Carbs/Protein/Fat ratio (e.g., 40/35/25)",
    "meals": [
      { "type": "Breakfast", "menu": "Specific menu with portions", "calories": "kcal", "reason": "Why this helps" },
      { "type": "Lunch", "menu": "Specific menu with portions", "calories": "kcal", "reason": "Why this helps" },
      { "type": "Dinner", "menu": "Specific menu with portions", "calories": "kcal", "reason": "Why this helps" },
      { "type": "Snack", "menu": "Specific healthy snack", "calories": "kcal", "reason": "Why this helps" }
    ],
    "weeklyPlan": [
      { "day": "Monday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Tuesday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Wednesday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Thursday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Friday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Saturday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" },
      { "day": "Sunday", "breakfast": "menu", "lunch": "menu", "dinner": "menu" }
    ]
  },
  "workoutPlan": {
    "summary": "Workout philosophy and approach (2-3 sentences)",
    "schedule": [
      { "day": "Day 1", "focus": "Target muscle group or cardio", "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "12-15", "rest": "60s", "note": "Form tip" }
      ]},
      { "day": "Day 2", "focus": "Target", "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "12-15", "rest": "60s", "note": "Form tip" }
      ]},
      { "day": "Day 3", "focus": "Target", "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "12-15", "rest": "60s", "note": "Form tip" }
      ]},
      { "day": "Day 4", "focus": "Target", "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "12-15", "rest": "60s", "note": "Form tip" }
      ]},
      { "day": "Day 5", "focus": "Target", "exercises": [
        { "name": "Exercise name", "sets": "3", "reps": "12-15", "rest": "60s", "note": "Form tip" }
      ]}
    ],
    "beginnerTip": "Advice for beginners (2-3 sentences)",
    "intermediateTip": "Advice for intermediate level (2-3 sentences)"
  },
  "supplements": [
    { "name": "Supplement name", "dosage": "Recommended dosage", "reason": "Why it helps with diet" }
  ],
  "motivation": "A warm, powerful motivational message (3-4 sentences)",
  "disclaimer": "This analysis is for informational purposes only. Please consult a healthcare professional before starting any diet or exercise program."
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

    // 2) 체중 변화 3x3 그리드 이미지 생성
    const optimalWeight = analysisResult.goal?.optimalWeight || "";

    const imagePrompt = `너는 최고의 다이어트 전문가(박사), 체형 변환 전문가(박사)이야.

이 사람의 실제 정보: 키 ${height}cm, 현재 체중 ${weight}kg, 목표 체중 ${optimalWeight}.

업로드한 얼굴 사진을 기반으로 3x3 그리드(총 9장)를 생성해줘.

**매우 중요한 규칙:**
- 1번 이미지(왼쪽 상단) = 현재 모습. 업로드한 사진과 동일한 얼굴 통통함/볼살을 유지해야 해.
- 9번 이미지(오른쪽 하단) = 최적 체중의 갸름한 얼굴. 턱선이 뚜렷하고, 볼살이 빠지고, 얼굴이 가장 날씬해야 해.
- 1번에서 9번으로 갈수록 점진적으로 얼굴이 갸름해져야 해. 절대로 반대가 되면 안 돼!
- 순서: 1(가장 통통) → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9(가장 갸름)
- 각 단계마다 볼살, 턱선, 이중턱 등이 조금씩 개선되어야 해.

**체중 변화 표현 방법:**
- 볼살: 1번에서 가장 통통 → 9번에서 가장 날씬
- 턱선: 1번에서 가장 둥글 → 9번에서 가장 V라인
- 이중턱: 1번에서 가장 있음 → 9번에서 완전히 없음
- 얼굴 윤곽: 1번에서 가장 넓음 → 9번에서 가장 좁고 갸름

각 이미지 위에 "Step 1 (${weight}kg)" ~ "Step 9 (${optimalWeight})" 형식으로 단계별 체중을 균등하게 나눠서 표시해줘.
첨부한 사람의 눈, 코, 입 등 얼굴 특징은 동일하게 유지하고 체중 관련 변화만 적용해줘.
각 이미지의 배경은 따뜻한 실내 조명의 자연스러운 분위기로 통일해줘.`;

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

    let transformImage = null;
    let transformText = "";
    if (imageResponse.ok) {
      const chunks = await imageResponse.json();
      const chunkArray = Array.isArray(chunks) ? chunks : [chunks];
      for (const chunk of chunkArray) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) transformImage = part.inlineData.data;
          if (typeof part.text === "string") transformText += part.text;
        }
      }
    }

    return new Response(JSON.stringify({
      ...analysisResult,
      transformImage,
      transformText,
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
