import { useState } from "react";
import { Sparkles, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChatService } from "@/services/chat.service";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export function ImageMode({
  apiKey,
  currentMode,
  selectedModel,
}: {
  apiKey: string;
  currentMode: string;
  selectedModel: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // NEW: number of images
  const [imageCount, setImageCount] = useState<number>(1);

  const base64ToBlobUrl = (b64: string) => {
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });
    return URL.createObjectURL(blob);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    const chatService = new ChatService();
    const selectedProvider = selectedModel === "chatgpt" ? "openai" : "unknown";
    const selectedModelName =
      selectedModel === "chatgpt" ? "gpt-image-1" : "unknown";

    const payload = {
      provider: selectedProvider,
      model: selectedModelName,
      apiKey,
      category: currentMode,
      prompt,
      imageCount, // NEW
    };

    try {
      const response = await chatService.sendMessage(payload);
      console.log("response:", response);

      if (response?.images?.length > 0) {
        const generatedItems: GeneratedImage[] = response.images.map(
          (img: any, idx: number) => ({
            id: `${Date.now()}-${idx}`,
            url: base64ToBlobUrl(img.b64_json || img.url),
            prompt,
            timestamp: new Date(),
          })
        );

        setImages((prev) => [...generatedItems, ...prev]);
        toast.success("Images generated successfully");
        setPrompt("");
      } else {
        toast.error("No image returned from API");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Prompt copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadImage = async (url: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `image-${id}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  return (
    <div className="flex h-full flex-col relative">
      {/* LOADING OVERLAY */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm opacity-90">Generating images...</p>
          </div>
        </div>
      )}

      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold">Image Generation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create stunning images from text descriptions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="p-6 border-primary/20 bg-card shadow-elevated">
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="min-h-[120px] resize-none bg-background"
                disabled={isGenerating}
              />

              {/* NEW: Select number of images */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Images:</label>
                <Select
                  value={String(imageCount)}
                  onValueChange={(value) => setImageCount(Number(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 shadow-glow"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Image(s)
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* IMAGE GRID */}
          {images.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold">No images yet</h3>
                <p className="text-muted-foreground">
                  Generated images will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="group overflow-hidden border-border hover:border-primary/50 transition-all animate-fade-in shadow-md hover:shadow-elevated"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPrompt(image.prompt, image.id)}
                        className="flex-1 gap-2"
                      >
                        {copiedId === image.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy Prompt
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(image.url, image.id)}
                        className="flex-1 gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      {image.timestamp.toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
