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
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
