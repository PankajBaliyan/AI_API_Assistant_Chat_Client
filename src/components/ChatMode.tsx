// ChatMode.tsx
import {
  Send,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  ArrowDown,
  Trash2,
  Square,
  SquareCheck,
} from "lucide-react";
import { toast } from "sonner";
import CryptoJS from "crypto-js";
import hljs from "highlight.js/lib/core";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import bash from "highlight.js/lib/languages/bash";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ChatService } from "@/services/chat.service";
import python from "highlight.js/lib/languages/python";
import jsx from "highlight.js/lib/languages/javascript";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const SECRET = import.meta.env.VITE_ENCRYPT_SECRET;

// Register languages for syntax highlighting
hljs.registerLanguage("jsx", jsx);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);

// Detect language for code blocks
function detectLanguage(code: string) {
  const result = hljs.highlightAuto(code);
  return result.language || "plaintext";
}

// ----- COPY BUTTON COMPONENT -----
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 bg-neutral-900/90 text-white rounded p-1 text-xs hover:bg-neutral-700 transition"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatMode({
  apiKey,
  currentMode,
  selectedAIProvider,
  selectedModel,
}: {
  apiKey: string;
  currentMode: string;
  selectedModel: string;
  selectedAIProvider: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    messageId: string | null;
  }>({ visible: false, x: 0, y: 0, messageId: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setShowScrollToBottom(false);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    setShowScrollToBottom(distanceFromBottom > 200);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // ----- DOWNLOAD CONVERSATION -----
  const downloadConversation = () => {
    if (!messages.length) {
      toast.info("No messages to download yet.");
      return;
    }

    const text = messages
      .map(
        (msg) => `[${msg.timestamp.toLocaleTimeString()}] ${msg.role.toUpperCase()}: ${msg.content}`
      )
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation downloaded");
  };

  // ----- WINDOW EVENT LISTENERS -----
  useEffect(() => {
    const newChatHandler = () => {
      setMessages([]);
      setSelectedMessages([]);
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    const downloadHandler = () => {
      downloadConversation();
    };

    window.addEventListener("new-chat", newChatHandler);
    window.addEventListener("download-chat", downloadHandler);

    return () => {
      window.removeEventListener("new-chat", newChatHandler);
      window.removeEventListener("download-chat", downloadHandler);
    };
  }, [messages]);

  // ----- EDIT MESSAGE -----
  const handleEditMessage = (msg: Message) => {
    setInput(msg.content);
    toast.success("Message loaded for editing.");
  };

  // ----- TOGGLE SELECTION -----
  const toggleSelectMessage = (id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const deleteSelectedMessages = () => {
    if (!selectedMessages.length) return;
    setMessages((prev) => prev.filter((m) => !selectedMessages.includes(m.id)));
    setSelectedMessages([]);
    toast.success("Selected messages deleted");
  };

  // ----- DELETE SINGLE MESSAGE -----
  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelectedMessages((prev) => prev.filter((mid) => mid !== id));
  };

  // ----- SEND MESSAGE -----
  const handleSend = () => {
    try {
      if (!input.trim()) return;

      if (!apiKey) {
        toast.error("Please enter your API key in the sidebar first.");
        return;
      }

      // handle selectedmodel or provider missing
      if (!selectedModel || !selectedAIProvider) {
        toast.error("Please select an AI provider and model in the sidebar.");
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: new Date(),
      };

      setIsGenerating(true);
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const chatService = new ChatService();

      const payload = {
        provider: selectedAIProvider ?? "unknown",
        model: selectedModel ?? "unknown",
        apiKey: CryptoJS.AES.encrypt(apiKey.trim(), SECRET).toString(),
        category: currentMode,
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: userMessage.content },
        ],
      };

      chatService
        .sendMessage(payload)
        .then((response) => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.output,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          setIsGenerating(false);
        })
        .catch((error) => {
          console.error("Error sending message:", error);

          const backendError =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Unknown error occurred";

          toast.error(backendError);

          setIsGenerating(false);
        });
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error");
      setIsGenerating(false);
    }
  };

  // ----- COPY MESSAGE -----
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ----- REGENERATE RESPONSE -----
  const handleRegenerate = (msg: Message) => {
    if (msg.role !== "assistant") return;

    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx === -1) return;

    if (!apiKey) {
      toast.error("Please enter your API key in the sidebar first.");
      return;
    }

    const chatService = new ChatService();
    setIsGenerating(true);

    const payload = {
      provider: selectedAIProvider ?? "unknown",
      model: selectedModel ?? "unknown",
      apiKey: CryptoJS.AES.encrypt(apiKey.trim(), SECRET).toString(),
      category: currentMode,
      messages: messages.slice(0, idx).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    chatService
      .sendMessage(payload)
      .then((response) => {
        const updated: Message = {
          ...msg,
          content: response.output,
          timestamp: new Date(),
        };

        setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        setIsGenerating(false);
        toast.success("Response regenerated");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to regenerate response");
        setIsGenerating(false);
      });
  };

  // ----- CONTEXT MENU -----
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, msg: Message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: msg.id,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const getContextMessage = (): Message | undefined =>
    messages.find((m) => m.id === contextMenu.messageId);

  const isSelected = (id: string) => selectedMessages.includes(id);

  const handleEnableApiKeyView = (
    apiKey: string,
    selectedModel: string,
    selectedAIProvider: string
  ) => {
    if (!apiKey) {
      toast.info(
        "For your security, the API key field is disabled by default. Click the eye icon to enable editing.",
        { duration: 10000 }
      );
    } else if (!selectedModel) {
      toast.info("Please select a model first.", { duration: 10000 });
    } else if (!selectedAIProvider) {
      toast.info("Please select an AI provider first.", { duration: 10000 });
    }
  };

  return (
    <div
      className="flex h-full flex-col relative"
      onClick={() => contextMenu.visible && closeContextMenu()}
    >
      {/* LOADING OVERLAY */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 border-4 border-white/40 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm opacity-90">Generating response...</p>
          </div>
        </div>
      )}

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-30 rounded-full bg-primary text-primary-foreground p-2 shadow-lg hover:bg-primary/90 transition"
          title="Scroll to latest message"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* CONTEXT MENU */}
      {contextMenu.visible && contextMenu.messageId && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-lg text-sm py-1 min-w-[180px]"
          style={{ top: contextMenu.y + 4, left: contextMenu.x + 4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const msg = getContextMessage();
            if (!msg) return null;

            const isUser = msg.role === "user";
            const isAssistant = msg.role === "assistant";

            return (
              <>
                {/* Copy */}
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    copyToClipboard(msg.content, msg.id);
                    closeContextMenu();
                  }}
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>

                {/* Edit (user only) */}
                {isUser && (
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      handleEditMessage(msg);
                      closeContextMenu();
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit message</span>
                  </button>
                )}

                {/* Regenerate (assistant only) */}
                {isAssistant && (
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      handleRegenerate(msg);
                      closeContextMenu();
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate response</span>
                  </button>
                )}

                {/* Delete Message */}
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    deleteMessage(msg.id);
                    closeContextMenu();
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete message</span>
                </button>

                {/* Select / Multi-select */}
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center gap-2"
                  onClick={() => {
                    toggleSelectMessage(msg.id);
                  }}
                >
                  {isSelected(msg.id) ? (
                    <SquareCheck className="w-3 h-3" />
                  ) : (
                    <Square className="w-3 h-3" />
                  )}
                  <span>{isSelected(msg.id) ? "Unselect message" : "Select message"}</span>
                </button>

                {/* Delete Selected */}
                {selectedMessages.length > 0 && (
                  <button
                    className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive flex items-center gap-2 border-t border-border mt-1"
                    onClick={() => {
                      deleteSelectedMessages();
                      closeContextMenu();
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete selected ({selectedMessages.length})</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-6 py-6"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold">Start a conversation</h3>
                <p className="text-muted-foreground">
                  Ask anything and your AI assistant will respond.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const selected = isSelected(msg.id);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                  >
                    <div
                      className={`relative max-w-[80%] rounded-2xl p-4 shadow-sm group cursor-default transition-all ${
                        isUser
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-card border border-border"
                      } ${selected ? "ring-2 ring-primary/70" : ""}`}
                    >
                      {/* Selection marker */}
                      {selected && (
                        <div className="absolute -left-3 top-3">
                          <SquareCheck className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">
                          {isUser ? "You" : "AI Assistant"} • {msg.timestamp.toLocaleTimeString()}
                        </span>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Regenerate quick icon for assistant */}
                          {!isUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Regenerate response"
                              onClick={() => handleRegenerate(msg)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Edit button (user) */}
                          {isUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              title="Edit message"
                              onClick={() => handleEditMessage(msg)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Markdown rendering */}
                      <ReactMarkdown
                        components={{
                          code({ inline, className, children, ...props }) {
                            const rawCode = String(children).replace(/\n$/, "");

                            if (inline) {
                              return (
                                <code className="bg-muted px-1 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }

                            const language =
                              className?.replace("language-", "") || detectLanguage(rawCode);

                            return (
                              <div className="relative group">
                                <CopyButton code={rawCode} />
                                <SyntaxHighlighter style={oneDark} language={language} PreTag="div">
                                  {rawCode}
                                </SyntaxHighlighter>
                              </div>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="border-t border-border bg-card/60 backdrop-blur-sm p-2">
        <div
          className="mx-auto max-w-4xl flex gap-3 items-center"
          onClick={() => {
            if (!apiKey || !selectedModel || !selectedAIProvider) {
              handleEnableApiKeyView(apiKey, selectedModel, selectedAIProvider);
            }
          }}
        >
          {(!apiKey || !selectedModel || !selectedAIProvider) && (
            <div className="absolute inset-0 z-10 cursor-not-allowed" />
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isGenerating || !apiKey || !selectedModel || !selectedAIProvider}
          />
          <Button
            onClick={handleSend}
            size="lg"
            className="bg-primary hover:bg-primary/90 shadow-glow"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for newline • Right-click messages for more actions
        </p>
      </div>
    </div>
  );
}
