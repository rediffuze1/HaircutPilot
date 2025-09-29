import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GlassButton } from "@/components/ui/glass-button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  salonId?: string;
}

export function VoiceAssistant({ isOpen, onClose, salonId }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("En attente...");
  const [aiResponse, setAiResponse] = useState("Bonjour ! Comment puis-je vous aider avec votre réservation ?");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMicClick = async () => {
    if (!isListening) {
      setIsListening(true);
      setTranscript("Écoute en cours...");
      setIsProcessing(true);
      
      // Mock listening and response
      setTimeout(() => {
        setTranscript("Je voudrais une coupe femme jeudi après-midi.");
        setTimeout(async () => {
          // In a real implementation, this would call the voice processing API
          try {
            const response = await fetch('/api/voice/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript: "Je voudrais une coupe femme jeudi après-midi.",
                salonId: salonId || 'demo'
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              setAiResponse(result.response);
            } else {
              setAiResponse("Parfait ! J'ai trouvé des créneaux jeudi après-midi. Nous avons 14h30 avec Sarah ou 16h15 avec Marie. Lequel préférez-vous ?");
            }
          } catch (error) {
            setAiResponse("Parfait ! J'ai trouvé des créneaux jeudi après-midi. Nous avons 14h30 avec Sarah ou 16h15 avec Marie. Lequel préférez-vous ?");
          }
          
          setIsListening(false);
          setIsProcessing(false);
        }, 1000);
      }, 2000);
    } else {
      setIsListening(false);
      setIsProcessing(false);
      setTranscript("En attente...");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Volume2 className="w-6 h-6 text-primary" />
            <span>Assistant IA Vocal</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          <GlassButton
            onClick={handleMicClick}
            className={cn(
              "w-24 h-24 rounded-full text-3xl",
              isListening && "animate-pulse"
            )}
            disabled={isProcessing}
            data-testid="voice-mic-button"
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-red-400" />
            ) : (
              <Mic className="w-8 h-8 text-primary" />
            )}
          </GlassButton>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {isListening ? "Écoute en cours..." : "Appuyez pour parler"}
            </h3>
            <p className="text-muted-foreground mb-6">
              Dites quelque chose comme "Je voudrais une coupe femme jeudi après-midi"
            </p>
          </div>
          
          <Card className="glass">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Transcription:</p>
              <p className="text-foreground" data-testid="voice-transcript">{transcript}</p>
            </CardContent>
          </Card>
          
          <Card className="glass bg-primary/10">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Réponse IA:</p>
              <p className="text-foreground" data-testid="voice-ai-response">{aiResponse}</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
