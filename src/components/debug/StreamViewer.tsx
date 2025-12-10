import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowDownCircle, ArrowUpCircle, Cable, CableIcon } from 'lucide-react';

interface StreamMessage {
  id: string;
  timestamp: number;
  relay: string;
  type: 'sent' | 'received';
  data: unknown;
}

interface StreamViewerProps {
  messages: StreamMessage[];
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function getMessageType(data: unknown): string {
  if (Array.isArray(data)) {
    return data[0] || 'UNKNOWN';
  }
  if (typeof data === 'object' && data !== null) {
    if ('type' in data && typeof data.type === 'string') {
      return data.type;
    }
  }
  return 'UNKNOWN';
}

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function getMessageTypeColor(type: string): string {
  const colors: Record<string, string> = {
    REQ: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    EVENT: 'bg-green-500/10 text-green-500 border-green-500/20',
    CLOSE: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    OK: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    EOSE: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    CLOSED: 'bg-red-500/10 text-red-500 border-red-500/20',
    NOTICE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    connection: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
}

export function StreamViewer({ messages }: StreamViewerProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <CableIcon className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No messages yet</p>
        <p className="text-xs mt-1">Connect to a relay and send a request to see the protocol stream</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-3">
        {messages.map((message) => {
          const messageType = getMessageType(message.data);
          const colorClass = getMessageTypeColor(messageType);

          return (
            <div
              key={message.id}
              className="border rounded-lg p-3 space-y-2 bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 shrink-0">
                  {message.type === 'sent' ? (
                    <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {message.type === 'sent' ? 'SENT' : 'RECEIVED'}
                  </span>
                </div>

                <Badge variant="outline" className={`font-mono text-xs ${colorClass}`}>
                  {messageType}
                </Badge>

                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cable className="h-3 w-3" />
                <span className="font-mono truncate">{message.relay}</span>
              </div>

              <div className="relative">
                <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto font-mono">
                  <code>{formatJson(message.data)}</code>
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
