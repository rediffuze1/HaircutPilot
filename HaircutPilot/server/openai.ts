import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "demo_key"
});

export interface VoiceInteractionResult {
  intent: string;
  entities: Record<string, any>;
  response: string;
  confidence: number;
}

export interface AnalysisRequest {
  question: string;
  context: Record<string, any>;
}

export interface AnalysisResult {
  answer: string;
  insights: string[];
  recommendations: string[];
}

// Voice receptionist functionality
export async function processVoiceInput(
  transcript: string,
  salonContext: {
    services: Array<{ id: string; name: string; duration: number; price: number }>;
    stylists: Array<{ id: string; name: string; specialties: string[] }>;
    availableSlots: Array<{ start: string; end: string; stylistId?: string }>;
  }
): Promise<VoiceInteractionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Tu es une réceptionniste IA professionnelle pour un salon de coiffure. Analyse la demande du client et réponds de manière naturelle et polie en français.

Contexte du salon:
Services disponibles: ${salonContext.services.map(s => `${s.name} (${s.duration}min, ${s.price}€)`).join(', ')}
Stylistes: ${salonContext.stylists.map(s => `${s.name} (spécialités: ${s.specialties.join(', ')})`).join(', ')}
Créneaux disponibles: ${salonContext.availableSlots.slice(0, 5).map(slot => `${slot.start} - ${slot.end}`).join(', ')}

Réponds au format JSON avec:
{
  "intent": "book|reschedule|cancel|inquiry",
  "entities": {
    "service": "nom du service demandé",
    "stylist": "nom du styliste demandé",
    "date": "date souhaitée",
    "time": "heure souhaitée",
    "client_name": "nom du client",
    "client_phone": "téléphone du client"
  },
  "response": "réponse naturelle à donner au client",
  "confidence": 0.85
}`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error("Error processing voice input:", error);
    return {
      intent: "unknown",
      entities: {},
      response: "Désolée, je n'ai pas bien compris. Pourriez-vous répéter votre demande ?",
      confidence: 0.1
    };
  }
}

// AI Assistant for analytics and insights
export async function analyzeBusinessData(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant IA spécialisé dans l'analyse de données pour les salons de coiffure. 
          Analyse les données fournies et réponds à la question en français de manière claire et actionnable.
          
          Réponds au format JSON avec:
          {
            "answer": "réponse directe à la question",
            "insights": ["insight 1", "insight 2", "insight 3"],
            "recommendations": ["recommandation 1", "recommandation 2"]
          }`
        },
        {
          role: "user",
          content: `Question: ${request.question}
          
          Données contextuelles: ${JSON.stringify(request.context, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      answer: result.answer || "Je n'ai pas pu analyser ces données.",
      insights: result.insights || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error analyzing business data:", error);
    return {
      answer: "Une erreur s'est produite lors de l'analyse.",
      insights: [],
      recommendations: []
    };
  }
}

// Text-to-Speech simulation (would integrate with real TTS service)
export function generateAudioResponse(text: string): { audioUrl: string; duration: number } {
  // This would integrate with a real TTS service like ElevenLabs, Azure Speech, etc.
  // For now, return mock data
  return {
    audioUrl: "/api/tts/mock", // Would be real audio URL
    duration: Math.ceil(text.length / 10) // Rough estimate: 10 chars per second
  };
}

// Speech-to-Text simulation (would integrate with real STT service)
export function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  // This would integrate with OpenAI Whisper, Azure Speech, etc.
  // For now, return mock transcription
  return Promise.resolve("Transcription simulée du message vocal");
}
