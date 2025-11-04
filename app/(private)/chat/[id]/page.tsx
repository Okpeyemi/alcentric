import { Header } from "../../components/header";
import { Sidebar } from "../../components/sidebar";
import { EditorPanel } from "./components/editor-panel";
import { ChatPanel } from "./components/chat-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  // TODO: Récupérer les données du chat depuis votre API/base de données
  const chatName = `${id}`;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header 
        title={chatName}
        showCommitButton={true}
        userName="John Doe"
        userAvatar="https://github.com/shadcn.png"
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeMenu="chat" />
        
        <main className="flex flex-1 bg-background">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={60}>
              <ChatPanel chatId={id} />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={70}>
              <EditorPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}
