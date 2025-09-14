
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will be caught by the App component and shown to the user.
  // In a real-world app, you might want more sophisticated handling.
  throw new Error("API_KEY environment variable not set. Please set your Gemini API key.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const GENERATION_PROMPT = `Generate an image using my photo:
Use a blue background with an overall bright and fair tone. 
The overall collage = 3x3 layout (nine images).
Each image inside the grid = portrait style (3:4).
Only show the pet’s face and the area above the chest.

First row (left to right):
	•	The pet sticks its tongue out slightly, looking happy.
	•	The pet bares its teeth, nose wrinkled, looking angry.
	•	One paw covers the face, cheeks blushing slightly, looking shy.

Second row:
	•	The pet lowers its ears, eyes drooping slightly, with a small frown, looking sad.
	•	The pet closes its left eye, keeps its right eye open, mouth smiling, as if winking playfully.
	•	With one paw raised, the pet smiles widely, looking like waving hand

Third row:
	•	The pet opens its eyes wide, mouth open, looking surprised.
	•	The pet yawns with mouth open, eyes squinting.
	•	The pet turns its head to the side, eyes open, looking thoughtful.

Each expression should vividly capture the pet’s “little emotions” in a lively and detailed way. Keep it realistic and photogenic, making the pet look extra cute. Maintain the original proportions without changing the pet’s details.`;

export async function generatePetCollage(base64ImageData: string, mimeType: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: GENERATION_PROMPT,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
        }
        
        console.warn("No image part found in Gemini API response.");
        return null;
    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        throw new Error("Failed to generate image due to an API error.");
    }
}
