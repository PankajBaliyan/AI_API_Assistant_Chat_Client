// index.tsx
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ChatMode } from "@/components/ChatMode";
import { ImageMode } from "@/components/ImageMode";
import { OtherMode } from "@/components/OtherMode";
import { CodingMode } from "@/components/CodingMode";
import { ModeSelector, Mode } from "@/components/ModeSelector";

const Index = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>("chat");
  const [selectedAIProvider, setSelectedAIProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("new-chat"));
    toast.success("Started new chat");
  };

  const handleDownloadChat = () => {
    window.dispatchEvent(new CustomEvent("download-chat"));
  };

  const renderMode = () => {
    switch (currentMode) {
      case "chat":
        return (
          <ChatMode
            apiKey={apiKey}
            currentMode={currentMode}
            selectedModel={selectedModel}
            selectedAIProvider={selectedAIProvider}
          />
        );

      case "image":
        return (
          <ImageMode
            apiKey={apiKey}
            currentMode={currentMode}
            selectedModel={selectedModel}
          />
        );

      case "coding":
        return (
          <CodingMode
            apiKey={apiKey}
            currentMode={currentMode}
            selectedModel={selectedModel}
          />
        );

      case "other":
        return (
          <OtherMode
            apiKey={apiKey}
            currentMode={currentMode}
            selectedModel={selectedModel}
          />
        );

      default:
        return (
          <ChatMode
            apiKey={apiKey}
            currentMode={currentMode}
            selectedModel={selectedModel}
            selectedAIProvider={selectedAIProvider}
          />
        );
    }
  };

  useEffect(() => {
    setApiKey("");
    setAvailableModels([]);
    setSelectedModel("");
  }, [selectedAIProvider]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentMode={currentMode}
        selectedAIProvider={selectedAIProvider}
        setSelectedAIProvider={setSelectedAIProvider}
        apiKey={apiKey}
        setApiKey={setApiKey}
        availableModels={availableModels}
        setAvailableModels={setAvailableModels}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center justify-between relative">
          {/* Centered Mode Selector */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
          </div>

          {/* Right icons */}
          <div className="flex gap-2 ml-auto">
            {/* New Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              title="Start New Chat"
              className="rounded-full hover:bg-accent"
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* Download Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownloadChat}
              title="Download Chat"
              className="rounded-full hover:bg-accent"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mode View */}
        <div className="flex-1 overflow-hidden">{renderMode()}</div>
      </div>
    </div>
  );
};

export default Index;
