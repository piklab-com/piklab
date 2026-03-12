import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateMarketingBrief = async (userInput: string, brandDNA?: any) => {
  const model = "gemini-1.5-pro"; // Use a stable model name
  
  const dna = brandDNA || { name: 'Piklab Müşterisi', colors: ['#FF6321'], toneOfVoice: 'Profesyonel' };

  const systemInstruction = `
    You are a creative director at Piklab, a high-end media agency. 
    Your goal is to help clients create a professional design brief.
    
    Brand DNA:
    - Name: ${dna.name}
    - Colors: ${dna.colors?.join(', ') || ''}
    - Tone: ${dna.toneOfVoice}
    
    User Input: "${userInput}"
    
    Based on the input and brand DNA, generate a structured design brief in JSON format.
    Include:
    - title: A catchy title for the task
    - description: Detailed instructions for the designer
    - type: One of ["post", "story", "reels", "banner", "other"]
    - suggestions: 3 creative ideas to make the content stand out
  `;

  const response = await ai.models.generateContent({
    model,
    contents: userInput,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "description", "type", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getBrandHealthScore = async (tasks: any[]) => {
  const model = "gemini-3.1-flash-preview";
  
  const prompt = `
    Analyze these design tasks and provide a "Brand Health Score" (0-100).
    Tasks: ${JSON.stringify(tasks)}
    
    Consider:
    - Consistency in status (are many tasks approved?)
    - Variety of content types
    - Frequency of revisions
    
    Return JSON with:
    - score: number
    - summary: string (brief explanation)
    - tips: string[] (3 tips for improvement)
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateMoodboard = async (brief: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a professional, high-quality moodboard or concept art for the following design brief. Style: Modern, clean, agency quality. Brief: ${brief}`,
          },
        ],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
  } catch (error) {
    console.error("Error generating moodboard:", error);
    return null;
  }
};

export const generateVideoFromText = async (prompt: string) => {
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    // We can't easily fetch and serve the video directly from the client due to CORS/API key headers
    // In a real app, you'd have a backend proxy this. For the prototype, we return the URI
    // and the client will need to handle it (or we just mock the final step if it's too complex for client-only)
    return downloadLink;
  } catch (error) {
    console.error("Error generating video:", error);
    return null;
  }
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/pcm;rate=24000;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const generateImageVariation = async (base64ImageData: string, prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData.split(',')[1], // Remove data URL prefix
              mimeType: 'image/png', // Assume PNG for now
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image variation:", error);
    return null;
  }
};

export const generateMultiSpeakerSpeech = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Joe',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
              },
              {
                speaker: 'Jane',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' }
                }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/pcm;rate=24000;base64,${base64Audio}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating multi-speaker speech:", error);
    return null;
  }
};

export const generateSocialContent = async (task: any, brand: any) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are an expert social media manager at Piklab.
    Generate a highly engaging social media caption and relevant hashtags for the following approved design task.
    
    Brand DNA:
    - Name: ${brand.name}
    - Tone of Voice: ${brand.toneOfVoice}
    - Target Audience: ${brand.targetAudience}
    
    Task Details:
    - Title: ${task.title}
    - Description: ${task.description}
    - Type: ${task.type}
    
    Return JSON with:
    - caption: string (The social media text, including emojis if appropriate for the tone)
    - hashtags: string[] (Array of 5-10 relevant hashtags without the # symbol)
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["caption", "hashtags"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating social content:", error);
    return null;
  }
};

export const generatePostingSchedule = async (tasks: any[], brand: any) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Analyze these approved design tasks and suggest the best posting schedule for the next 7 days.
    Brand DNA: ${JSON.stringify(brand)}
    Tasks: ${JSON.stringify(tasks)}
    
    Return JSON with an array of objects:
    - taskId: string
    - scheduledDate: string (ISO 8601 format)
    - reason: string (Why this time is best)
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              scheduledDate: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["taskId", "scheduledDate", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating posting schedule:", error);
    return [];
  }
};
