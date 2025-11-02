"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "./code-editor";

export function EditorPanel() {
  const [code, setCode] = useState(`// Exemple de code TypeScript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
`);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-black">
      <Tabs defaultValue="code" className="flex h-full flex-1 flex-col p-6">
        <TabsList className="w-fit">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 mt-4" style={{ minHeight: 0 }}>
          <CodeEditor
            defaultValue={code}
            language="typescript"
            onChange={handleCodeChange}
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-4">
          <div className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              Preview à venir...
            </p>
            {/* TODO: Ajouter le preview ici */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
