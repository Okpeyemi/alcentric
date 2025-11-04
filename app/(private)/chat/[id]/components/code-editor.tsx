"use client"

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  defaultValue?: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

export function CodeEditor({
  defaultValue = "// Commencez à coder ici...\n",
  language = "typescript",
  onChange,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
            <p className="text-sm text-muted-foreground">
              Chargement de l'éditeur...
            </p>
          </div>
        </div>
      )}
      
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={defaultValue}
        theme={theme === "dark" ? "vs-dark" : "light"}
        onChange={handleEditorChange}
        onMount={() => setIsLoading(false)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          fontFamily: "var(--font-dm-sans), 'Courier New', monospace",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
        }}
      />
    </div>
  );
}
