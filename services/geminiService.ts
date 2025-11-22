import { GoogleGenAI } from "@google/genai";
import { ImageData } from '../types';

// Convert Blob/File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data-URL declaration (e.g. data:image/png;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const analyzeImageDifference = async (imageA: ImageData, imageB: ImageData): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const base64A = await fileToBase64(imageA.file);
    const base64B = await fileToBase64(imageB.file);

    const prompt = `
      Actúa como un experto en análisis visual y diseño gráfico. 
      Compara estas dos imágenes (Imagen A e Imagen B). 
      Describe en detalle:
      1. Diferencias visuales principales (color, iluminación, composición).
      2. Si parece ser una edición (antes/después), describe qué cambios se aplicaron.
      3. Detalles técnicos notables.
      
      Sé conciso y utiliza viñetas para formatear la respuesta.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: "Esta es la Imagen A:" },
          { inlineData: { mimeType: imageA.type, data: base64A } },
          { text: "Esta es la Imagen B:" },
          { inlineData: { mimeType: imageB.type, data: base64B } },
          { text: prompt }
        ]
      }
    });

    return response.text || "No se pudo generar un análisis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const editImageWithGenAI = async (image: ImageData, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const base64 = await fileToBase64(image.file);

    // Using gemini-2.5-flash-image for image editing tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: image.type, 
              data: base64 
            } 
          },
          { text: `Edita esta imagen siguiendo estrictamente esta instrucción: ${prompt}. Mantén la estructura original de la imagen lo más posible.` },
        ],
      },
    });

    // Iterate through parts to find the image part (as per SDK guidelines)
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No se generó ninguna imagen.");
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};