import { useState } from "react";
import { Code, Copy, Download, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ChatService } from "@/services/chat.service";

interface CodeOutput {
  id: string;
  code: string;
  language: string;
  prompt: string;
  timestamp: Date;
}

export function CodingMode({
  apiKey,
  currentMode,
  selectedModel,
}: {
  apiKey: string;
  currentMode: string;
  selectedModel: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [outputs, setOutputs] = useState<CodeOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /**
   * Detect programming language from user prompt
   */
  const detectLanguageFromPrompt = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (p.includes("python")) return "python";
    if (p.includes("java ")) return "java";
    if (p.includes("c++")) return "cpp";
    if (p.includes("c#")) return "csharp";
    if (p.includes("ruby")) return "ruby";
    if (p.includes("go ")) return "go";
    if (p.includes("php")) return "php";
    if (p.includes("typescript") || p.includes("ts")) return "typescript";
    if (p.includes("javascript") || p.includes("js")) return "javascript";
    return "javascript";
  };

  /**
   * Detect language from markdown fences like ```cpp ... ```
   */
  const detectLanguageFromFence = (code: string): string | null => {
    const match = code.match(/^```([a-zA-Z0-9#+-]*)/);
    if (match && match[1]) {
      const lang = match[1].toLowerCase();
      if (lang === "c++") return "cpp";
      if (lang === "c#") return "csharp";
      return lang;
    }
    return null;
  };

  /**
   * Remove markdown fences from code blocks
   */
  const cleanCodeBlock = (raw: string): string => {
    return raw
      .replace(/^```[a-zA-Z0-9#+-]*\s*/, "") // remove starting fence
      .replace(/```$/, "") // remove ending fence
      .trim();
  };

  /**
   * Handle API call + store output
   */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const chatService = new ChatService();

    console.log("Selected Model:", selectedModel);

    const providerMap: Record<string, string> = {
      chatgpt: "openai",
      gemini: "gemini",
    };

    const modelMap: Record<string, string> = {
      chatgpt: "gpt-4.1",
      gemini: "gemini-2.5-pro",
    };

    const selectedProvider = providerMap[selectedModel] ?? "unknown";
    const selectedModelName = modelMap[selectedModel] ?? "unknown";

    const payload = {
      provider: selectedProvider,
      model: selectedModelName,
      apiKey,
      category: "coding",
      prompt,
    };

    try {
      const response = await chatService.sendMessage(payload);
      const rawOutput = response?.output || "";

      // 1) Extract language if ```lang detected
      const fencedLang = detectLanguageFromFence(rawOutput);

      // 2) Clean code
      const cleanedCode = cleanCodeBlock(rawOutput);

      const newOutput: CodeOutput = {
        id: String(Date.now()),
        code: cleanedCode || "// No code generated.",
        language: fencedLang || detectLanguageFromPrompt(prompt),
        prompt,
        timestamp: new Date(),
      };

      setOutputs((prev) => [newOutput, ...prev]);
      setPrompt("");
      toast.success("Code generated successfully");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy code to clipboard
   */
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Download code
   */
  const downloadCode = (code: string, id: string, language: string) => {
    const extensionMap: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      ruby: "rb",
      go: "go",
      php: "php",
    };

    const ext = extensionMap[language] || "txt";

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `code-${id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Code downloaded");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold">Coding Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate code snippets and solutions with AI
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="p-6 border-primary/20 bg-card shadow-elevated">
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to code... (e.g., 'Create a function to sort an array')"
                className="min-h-[120px] resize-none bg-background"
              />

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
                    Generate Code
                  </>
                )}
              </Button>
            </div>
          </Card>

          {outputs.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">👨‍💻</div>
                <h3 className="text-xl font-semibold">No code generated yet</h3>
                <p className="text-muted-foreground">
                  Your AI-generated code will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {outputs.map((output) => (
                <Card
                  key={output.id}
                  className="overflow-hidden border-border hover:border-primary/50 transition-colors animate-fade-in shadow-md"
                >
                  <div className="bg-secondary/50 px-4 py-3 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Code className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {output.language.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {output.prompt}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {output.timestamp.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(output.code, output.id)}
                          className="gap-2"
                        >
                          {copiedId === output.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            downloadCode(
                              output.code,
                              output.id,
                              output.language
                            )
                          }
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  <SyntaxHighlighter
                    language={output.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: "hsl(var(--card))",
                      fontSize: "0.875rem",
                    }}
                    showLineNumbers
                  >
                    {output.code}
                  </SyntaxHighlighter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
