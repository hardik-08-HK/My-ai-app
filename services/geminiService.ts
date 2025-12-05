
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, AdminConfig, ModelMode } from '../types';

const getAdminConfig = (): AdminConfig => {
  const saved = localStorage.getItem('hk_admin_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse config", e);
    }
  }
  return {
    systemInstruction: "You are OFFICIAL HK AI, a helpful, intelligent, and secure AI assistant created by Hardik.",
    securityLevel: 'high',
    features: {
      codeGeneration: true,
      imageAnalysis: true
    }
  };
};

interface AIResponse {
  text: string;
  generatedImage?: string;
}

export const generateAdminConfigFromPrompt = async (
  prompt: string,
  currentConfig: AdminConfig
): Promise<AdminConfig> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are the System Architect for 'OFFICIAL HK AI'. 
Your goal is to interpret natural language commands to reconfigure the AI's behavior, security, and features.

Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Output a VALID JSON object matching this schema exactly:
{
  "systemInstruction": "string (The new system prompt/persona)",
  "securityLevel": "standard" | "high" | "maximum",
  "features": {
    "codeGeneration": boolean,
    "imageAnalysis": boolean
  }
}

Rules:
1. Update the 'systemInstruction' to reflect the persona or rules requested.
2. Adjust 'securityLevel' if requested (standard = loose, high = strict, maximum = paranoid).
3. Toggle features based on the request (e.g. "disable coding" -> codeGeneration: false).
4. If the user asks for something dangerous, set securityLevel to 'maximum'.
5. Return ONLY raw JSON. No markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No config generated");
    
    return JSON.parse(text) as AdminConfig;
  } catch (error) {
    console.error("Failed to generate config:", error);
    throw error;
  }
};

export const generateAIResponse = async (
  currentHistory: Message[],
  newMessage: string,
  images: string[] = [],
  mode: ModelMode = 'standard'
): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const config = getAdminConfig();
  
  // Security Check
  if (config.securityLevel === 'maximum') {
    const lowerMsg = newMessage.toLowerCase();
    if (lowerMsg.includes('hack') || lowerMsg.includes('exploit') || lowerMsg.includes('crack')) {
       throw new Error("SECURITY_VIOLATION");
    }
  }

  // Feature Check
  if (!config.features.codeGeneration && (newMessage.toLowerCase().includes('code') || newMessage.toLowerCase().includes('function'))) {
     return { text: "I apologize, but code generation has been disabled by the administrator." };
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Image Generation Mode
  if (mode === 'creative' && images.length === 0) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: newMessage }]
        },
      });
      
      let generatedImage: string | undefined;
      let text = "";

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImage = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
      }
      
      return { text: text || "Here is your generated image.", generatedImage };
    } catch (e) {
      console.error("Image Gen Error", e);
      return { text: "Failed to generate image. Please try a different prompt." };
    }
  }

  // 2. Image Editing (User uploaded image + Creative Mode)
  if (mode === 'creative' && images.length > 0) {
     const parts: any[] = [{ text: newMessage }];
     images.forEach(img => {
        const base64Data = img.split(',')[1] || img;
        const mimeType = img.match(/data:([^;]+);/)?.[1] || 'image/png';
        parts.push({
            inlineData: {
                mimeType,
                data: base64Data
            }
        });
     });

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts }
     });

     let generatedImage: string | undefined;
     let text = "";

     for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImage = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text += part.text;
        }
     }
     return { text: text || "Here is your edited image.", generatedImage };
  }

  // 3. Complex/Thinking Mode
  if (mode === 'thinking') {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: newMessage,
        config: {
            thinkingConfig: { thinkingBudget: 1024 }, 
            systemInstruction: config.systemInstruction
        }
    });
    return { text: response.text || "No response generated." };
  }

  // 4. Research/Search Mode
  if (mode === 'research') {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: newMessage,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: config.systemInstruction
        }
     });
     
     return { text: response.text || "No search results found." };
  }

  // 5. Standard Chat (Default)
  const historyContext = currentHistory.map(m => `${m.role === 'user' ? 'User' : 'HK AI'}: ${m.text}`).join('\n');
  const fullPrompt = `Previous Conversation:\n${historyContext}\n\nCurrent User Input: ${newMessage}`;
  
  const parts: any[] = [{ text: fullPrompt }];
  images.forEach(img => {
    const base64Data = img.split(',')[1] || img;
    const mimeType = img.match(/data:([^;]+);/)?.[1] || 'image/png';
    parts.push({
        inlineData: { mimeType, data: base64Data }
    });
  });

  // Check if image analysis is allowed by config
  if (images.length > 0 && !config.features.imageAnalysis) {
      return { text: "Image analysis capabilities have been disabled by the administrator." };
  }

  const modelName = images.length > 0 ? 'gemini-2.5-flash' : 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
        systemInstruction: config.systemInstruction
    }
  });

  return { text: response.text || "I couldn't generate a response." };
};
