import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface RelayConnection {
  url: string;
  connected: boolean;
  ws: WebSocket | null;
}

interface RequestBuilderProps {
  relays: RelayConnection[];
  onSend: (relay: string, type: 'sent' | 'received', data: unknown) => void;
}

const REQ_TEMPLATE = `["REQ", "sub1", {
  "kinds": [1],
  "limit": 10
}]`;

const CLOSE_TEMPLATE = `["CLOSE", "sub1"]`;

const EVENT_TEMPLATE = `["EVENT", {
  "id": "<calculated after signing>",
  "pubkey": "<your 32-byte hex pubkey>",
  "created_at": ${Math.floor(Date.now() / 1000)},
  "kind": 1,
  "tags": [],
  "content": "Hello Nostr!",
  "sig": "<calculated after signing>"
}]`;

export function RequestBuilder({ relays, onSend }: RequestBuilderProps) {
  const [messageType, setMessageType] = useState<'REQ' | 'CLOSE' | 'EVENT' | 'CUSTOM'>('REQ');
  const [messageContent, setMessageContent] = useState(REQ_TEMPLATE);
  const [selectedRelay, setSelectedRelay] = useState<string>('all');
  const { toast } = useToast();

  const handleTypeChange = (type: 'REQ' | 'CLOSE' | 'EVENT' | 'CUSTOM') => {
    setMessageType(type);
    switch (type) {
      case 'REQ':
        setMessageContent(REQ_TEMPLATE);
        break;
      case 'CLOSE':
        setMessageContent(CLOSE_TEMPLATE);
        break;
      case 'EVENT':
        setMessageContent(EVENT_TEMPLATE);
        break;
      case 'CUSTOM':
        setMessageContent('');
        break;
    }
  };

  const sendMessage = () => {
    const connectedRelays = relays.filter((r) => r.connected);

    if (connectedRelays.length === 0) {
      toast({
        title: 'No connected relays',
        description: 'Please connect to at least one relay first',
        variant: 'destructive',
      });
      return;
    }

    let message: unknown;
    try {
      message = JSON.parse(messageContent);
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Please check your message format',
        variant: 'destructive',
      });
      return;
    }

    if (!Array.isArray(message)) {
      toast({
        title: 'Invalid message',
        description: 'Nostr messages must be JSON arrays',
        variant: 'destructive',
      });
      return;
    }

    const targetRelays =
      selectedRelay === 'all'
        ? connectedRelays
        : connectedRelays.filter((r) => r.url === selectedRelay);

    if (targetRelays.length === 0) {
      toast({
        title: 'No target relay',
        description: 'Selected relay is not connected',
        variant: 'destructive',
      });
      return;
    }

    let successCount = 0;
    targetRelays.forEach((relay) => {
      if (relay.ws && relay.ws.readyState === WebSocket.OPEN) {
        try {
          relay.ws.send(JSON.stringify(message));
          onSend(relay.url, 'sent', message);
          successCount++;
        } catch (error) {
          toast({
            title: 'Send failed',
            description: `Failed to send to ${relay.url}: ${error}`,
            variant: 'destructive',
          });
        }
      }
    });

    if (successCount > 0) {
      toast({
        title: 'Message sent',
        description: `Sent to ${successCount} relay${successCount > 1 ? 's' : ''}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message Type</Label>
        <Select value={messageType} onValueChange={(v) => handleTypeChange(v as typeof messageType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REQ">REQ - Subscribe to events</SelectItem>
            <SelectItem value="CLOSE">CLOSE - Close subscription</SelectItem>
            <SelectItem value="EVENT">EVENT - Publish event</SelectItem>
            <SelectItem value="CUSTOM">CUSTOM - Custom message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Relay</Label>
        <Select value={selectedRelay} onValueChange={setSelectedRelay}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All connected relays</SelectItem>
            {relays
              .filter((r) => r.connected)
              .map((relay) => (
                <SelectItem key={relay.url} value={relay.url}>
                  {relay.url}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Message Content (JSON)</Label>
        <Textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          className="font-mono text-xs min-h-[200px]"
          placeholder="Enter JSON array message..."
        />
      </div>

      <Button onClick={sendMessage} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        Send Message
      </Button>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Tip:</strong> Use the templates as starting points for your messages.
        </p>
        <p>For REQ messages, adjust filters to query specific events.</p>
        <p>For CLOSE messages, use the same subscription ID from your REQ.</p>
      </div>
    </div>
  );
}
