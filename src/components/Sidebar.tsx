// Sidebar.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import CryptoJS from "crypto-js";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatService } from "@/services/chat.service";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, EyeOff, ChevronLeft, ChevronRight, Settings } from "lucide-react";

const SECRET = import.meta.env.VITE_ENCRYPT_SECRET;
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentMode: string;

  selectedAIProvider: string;
  setSelectedAIProvider: (provider: string) => void;

  apiKey: string;
  setApiKey: (key: string) => void;

  availableModels: string[];
  setAvailableModels: (models: string[]) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  currentMode,
  selectedAIProvider,
  setSelectedAIProvider,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  availableModels,
  setAvailableModels,
}: SidebarProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleListModels = async () => {
    try {
      setLoadingModels(true);
      setErrorMessage("");

      const chatService = new ChatService();

      const payload = {
        platform: selectedAIProvider,
        apiKey: CryptoJS.AES.encrypt(apiKey.trim(), SECRET).toString(),
        onlyNames: true,
      };

      const result = await chatService.listModels(payload);

      if (result.models) {
        setAvailableModels(result.models);
        setApiKey(apiKey.trim()); // Ensure API key is trimmed
        setSelectedModel(result.models[0] || ""); // Select first model by default
        toast.success("Models loaded successfully");
      } else {
        setAvailableModels([]);
        setErrorMessage("No models found.");
      }
    } catch (error: any) {
      setAvailableModels([]);
      console.error(error);
      setErrorMessage(
        error?.response?.data?.details || error?.response?.data?.error || "Failed to list models."
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const getBestModelClass = (model: string) => {
    if ((model === "gpt-5.1" || model === "gemini-2.5-pro") && currentMode === "chat") {
      return "bg-emerald-500/20 text-emerald-400";
    }
    return "";
  };

  const handleEnableApiKeyView = () => {
    toast.info(
      "For your security, the API key field is disabled by default. Click the eye icon to enable editing.",
      { duration: 10000 }
    );
  };

  return (
    <div
      className={cn(
        "relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex",
        isCollapsed ? "w-16" : "w-80"
      )}
    >
      {/* Collapsed */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-6 w-full animate-fade-in">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-10 w-10 rounded-xl hover:bg-sidebar-accent transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
          </Button>
        </div>
      )}

      {/* Expanded */}
      {!isCollapsed && (
        <div className="flex flex-col w-full animate-fade-in h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Studio
              </h2>
              <p className="text-sm text-muted-foreground">Configure your AI model</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-9 w-9 rounded-xl hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 space-y-6 overflow-auto pb-4">
            {/* Provider selection */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={selectedAIProvider} onValueChange={setSelectedAIProvider}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div
              className="space-y-2"
              onClick={() => {
                if (!showApiKey) {
                  handleEnableApiKeyView();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <Label>API Key</Label>
                <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOff /> : <Eye />}
                </Button>
              </div>

              <div className="relative">
                {/* Transparent overlay WHEN disabled */}
                {!showApiKey && <div className="absolute inset-0 z-10 cursor-not-allowed" />}

                <Textarea
                  value={showApiKey ? apiKey : "•".repeat(apiKey.length)}
                  onChange={(e) => showApiKey && setApiKey(e.target.value)}
                  placeholder="Enter your API Key"
                  className="min-h-[100px] bg-secondary font-mono text-xs"
                  disabled={!showApiKey}
                />
              </div>
            </div>

            {/* List Models */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleListModels}
                className="w-full"
                disabled={!apiKey || loadingModels}
              >
                {loadingModels ? "Loading..." : "List Models"}
              </Button>

              {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

              {/* Models dropdown */}
              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label>Choose Model</Label>

                  <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value)}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-auto bg-popover">
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className={getBestModelClass(model)}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Theme Toggle */}
          <div className="p-6 border-t border-border mt-auto text-xs text-muted-foreground space-y-3">
            <div className="flex items-center justify-between">
              <span>Appearance</span>
              <ThemeToggle />
            </div>

            <p>
              <strong>Provider:</strong> {selectedAIProvider || "None"}
            </p>
            <p>
              <strong>Status:</strong> {apiKey ? "Connected" : "Not configured"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
