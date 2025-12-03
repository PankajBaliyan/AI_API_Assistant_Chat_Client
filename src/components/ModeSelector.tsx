import { MessageSquare, Image, Code, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Mode = "chat" | "image" | "coding" | "other";

interface ModeSelectorProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <Tabs value={currentMode} onValueChange={(value) => onModeChange(value as Mode)}>
      <TabsList className="grid grid-cols-4 bg-secondary/50 w-[500px]">
        <TabsTrigger
          value="chat"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </TabsTrigger>
        <TabsTrigger
          value="image"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          disabled={true}
        >
          <Image className="mr-2 h-4 w-4" />
          Images
        </TabsTrigger>
        <TabsTrigger
          value="coding"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          disabled={true}
        >
          <Code className="mr-2 h-4 w-4" />
          Coding
        </TabsTrigger>
        <TabsTrigger
          value="other"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          More
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
