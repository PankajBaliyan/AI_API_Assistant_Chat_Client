// Sidebar.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CryptoJS from "crypto-js";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChatService } from "@/services/chat.service";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  // Clear models and error messages when provider or API key changes
  useEffect(() => {
    if (availableModels.length > 0 || errorMessage) {
      setAvailableModels([]);
      setSelectedModel("");
      setSearchQuery("");
      setErrorMessage("");
    }
    // Only clear when provider or apiKey change, not when models or error themselves change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAIProvider, apiKey]);

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
        error?.response?.data?.details ||
          error?.response?.data?.error ||
          "Failed to list models.",
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const getBestModelClass = (model: string) => {
    if (
      (model === "gpt-5.1" || model === "gemini-2.5-pro") &&
      currentMode === "chat"
    ) {
      return "bg-emerald-500/20 text-emerald-400";
    }
    return "";
  };

  const handleEnableApiKeyView = () => {
    toast.info(
      "For your security, the API key field is disabled by default. Click the eye icon to enable editing.",
      { duration: 10000 },
    );
  };

  return (
    <div
      className={cn(
        "relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex",
        isCollapsed ? "w-16" : "w-80",
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
              <p className="text-sm text-muted-foreground">
                Configure your AI model
              </p>
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
              <Select
                value={selectedAIProvider}
                onValueChange={setSelectedAIProvider}
              >
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
              // onClick={() => {
              //   if (!showApiKey) {
              //     handleEnableApiKeyView();
              //   }
              // }}
            >
              <div className="flex items-center justify-between">
                <Label>API Key</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10 transition-all rounded-md"
                >
                  {showApiKey ? "Hide" : "Show"}
                </Button>
              </div>

              <div className="relative">
                {/* Transparent overlay WHEN disabled */}
                {/* {!showApiKey && (
                  <div className="absolute inset-0 z-10 cursor-not-allowed" />
                )} */}

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

              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}

              {/* Models dropdown */}
              {availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label>Choose Model</Label>

                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-secondary font-normal border-none hover:bg-secondary/80 h-10 px-3"
                      >
                        <span className="truncate max-w-[200px]">
                          {selectedModel
                            ? availableModels.find((m) => m === selectedModel)
                            : "Select a model..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[304px] p-0 shadow-xl border-sidebar-border bg-popover"
                      align="start"
                    >
                      <Command className="bg-popover border-none">
                        <div className="flex items-center border-b border-sidebar-border px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <CommandInput
                            placeholder="Search models..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                          />
                        </div>
                        <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No models found.
                          </CommandEmpty>
                          <CommandGroup>
                            {availableModels.map((model) => (
                              <CommandItem
                                key={model}
                                value={model}
                                onSelect={(currentValue) => {
                                  setSelectedModel(
                                    currentValue === selectedModel
                                      ? ""
                                      : currentValue,
                                  );
                                  setOpen(false);
                                  setSearchQuery("");
                                }}
                                className={cn(
                                  "flex items-center px-3 py-2 cursor-pointer transition-colors duration-200",
                                  getBestModelClass(model),
                                )}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 transition-all duration-200",
                                    selectedModel === model
                                      ? "opacity-100 scale-100"
                                      : "opacity-0 scale-0",
                                  )}
                                />
                                <span className="truncate">{model}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
