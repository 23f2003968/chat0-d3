import { useChat } from '@ai-sdk/react';
import Messages from './Messages';
import ChatInput from './ChatInput';
import MessageNavigator from './MessageNavigator';
import { UIMessage } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { createMessage } from '@/frontend/dexie/queries';
import { useAPIKeyStore } from '@/frontend/stores/APIKeyStore';
import { useModelStore } from '@/frontend/stores/ModelStore';
import { MessageSquareMore } from 'lucide-react';
import { Button } from './ui/button';
import ThemeToggler from './ui/ThemeToggler';
import { useMessageNavigation } from '@/frontend/hooks/useMessageNavigation';

interface ChatProps {
  threadId: string;
  initialMessages: UIMessage[];
}

export default function Chat({ threadId, initialMessages }: ChatProps) {
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const modelConfig = useModelStore((state) => state.getModelConfig());

  const {
    isNavigatorVisible,
    registerRef,
    scrollToMessage,
    handleToggleNavigator,
  } = useMessageNavigation();

  const {
    messages,
    input,
    status,
    setInput,
    setMessages,
    append,
    stop,
    reload,
    error,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async ({ parts }) => {
      const aiMessage: UIMessage = {
        id: uuidv4(),
        parts: parts as UIMessage['parts'],
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      try {
        await createMessage(threadId, aiMessage);
      } catch (error) {
        console.error(error);
      }
    },
    headers: {
      [modelConfig.headerKey]: getKey(modelConfig.provider) || '',
    },
    body: {
      model: selectedModel,
    },
  });

  return (
    <div className="relative w-full">
      <main className="flex flex-col w-full max-w-3xl pt-10 pb-44 mx-auto">
        <Messages
          threadId={threadId}
          messages={messages}
          status={status}
          setMessages={setMessages}
          reload={reload}
          error={error}
          registerRef={registerRef}
          stop={stop}
        />
        <ChatInput
          threadId={threadId}
          input={input}
          status={status}
          append={append}
          setInput={setInput}
          stop={stop}
        />
      </main>
      <ThemeToggler />
      <Button
        onClick={handleToggleNavigator}
        variant="outline"
        size="icon"
        className="fixed right-16 top-4 z-20"
        aria-label={
          isNavigatorVisible
            ? 'Hide message navigator'
            : 'Show message navigator'
        }
      >
        <MessageSquareMore className="h-5 w-5" />
      </Button>

      {isNavigatorVisible && (
        <MessageNavigator
          threadId={threadId}
          scrollToMessage={scrollToMessage}
        />
      )}
    </div>
  );
}
