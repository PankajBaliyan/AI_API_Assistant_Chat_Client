import { Rocket, Zap, Brain, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

export function OtherMode({ apiKey, currentMode, selectedModel }: { apiKey: string; currentMode: string; selectedModel: string }) {
  const upcomingFeatures = [
    {
      icon: Rocket,
      title: "Voice Conversations",
      description: "Talk naturally with your AI assistant using voice input and output",
    },
    {
      icon: Zap,
      title: "Prompt Templates",
      description: "Pre-built templates for common AI tasks and use cases",
    },
    {
      icon: Brain,
      title: "Memory & Context",
      description: "AI that remembers your preferences and conversation history",
    },
    {
      icon: Target,
      title: "Multi-Model Compare",
      description: "Compare responses from different AI models side-by-side",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold">Coming Soon</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exciting features in development
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <div className="text-6xl mb-4 animate-glow">✨</div>
            <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              More Features Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're constantly working on new and exciting features to make your AI
              experience even better. Here's what's on the horizon:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <Card
                key={index}
                className="p-6 border-border hover:border-primary/50 transition-all hover:shadow-elevated animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <h3 className="text-lg font-semibold mb-2">Have a Feature Request?</h3>
            <p className="text-sm text-muted-foreground">
              We'd love to hear your ideas! The modes you see here are just the beginning.
              <br />
              Stay tuned for more amazing features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
