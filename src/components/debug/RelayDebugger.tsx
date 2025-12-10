import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface RelayConnection {
  url: string;
  connected: boolean;
  ws: WebSocket | null;
}

interface RelayDebuggerProps {
  relays: RelayConnection[];
  setRelays: (relays: RelayConnection[]) => void;
  onMessage: (relay: string, type: 'sent' | 'received', data: unknown) => void;
}

export function RelayDebugger({ relays, setRelays, onMessage }: RelayDebuggerProps) {
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const { toast } = useToast();

  const addRelay = () => {
    const url = newRelayUrl.trim();
    
    if (!url) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a relay URL',
        variant: 'destructive',
      });
      return;
    }

    if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
      toast({
        title: 'Invalid URL',
        description: 'Relay URL must start with wss:// or ws://',
        variant: 'destructive',
      });
      return;
    }

    if (relays.some((r) => r.url === url)) {
      toast({
        title: 'Duplicate relay',
        description: 'This relay is already in the list',
        variant: 'destructive',
      });
      return;
    }

    const newRelay: RelayConnection = {
      url,
      connected: false,
      ws: null,
    };

    setRelays([...relays, newRelay]);
    setNewRelayUrl('');
  };

  const removeRelay = (url: string) => {
    const relay = relays.find((r) => r.url === url);
    if (relay?.ws) {
      relay.ws.close();
    }
    setRelays(relays.filter((r) => r.url !== url));
  };

  const connectRelay = (url: string) => {
    const relay = relays.find((r) => r.url === url);
    if (!relay) return;

    if (relay.ws) {
      relay.ws.close();
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setRelays(
          relays.map((r) =>
            r.url === url ? { ...r, connected: true, ws } : r
          )
        );
        toast({
          title: 'Connected',
          description: `Connected to ${url}`,
        });
        onMessage(url, 'received', { type: 'connection', status: 'connected' });
      };

      ws.onclose = () => {
        setRelays(
          relays.map((r) =>
            r.url === url ? { ...r, connected: false, ws: null } : r
          )
        );
        onMessage(url, 'received', { type: 'connection', status: 'disconnected' });
      };

      ws.onerror = (error) => {
        toast({
          title: 'Connection error',
          description: `Failed to connect to ${url}`,
          variant: 'destructive',
        });
        onMessage(url, 'received', { type: 'error', error: error.toString() });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(url, 'received', data);
        } catch (error) {
          onMessage(url, 'received', { type: 'parse_error', raw: event.data });
        }
      };

      setRelays(
        relays.map((r) =>
          r.url === url ? { ...r, ws } : r
        )
      );
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const disconnectRelay = (url: string) => {
    const relay = relays.find((r) => r.url === url);
    if (relay?.ws) {
      relay.ws.close();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="wss://relay.example.com"
          value={newRelayUrl}
          onChange={(e) => setNewRelayUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRelay()}
        />
        <Button onClick={addRelay} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {relays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No relays configured. Add a relay to get started.
          </div>
        ) : (
          relays.map((relay) => (
            <div
              key={relay.url}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono truncate">{relay.url}</span>
                  <Badge variant={relay.connected ? 'default' : 'secondary'} className="shrink-0">
                    {relay.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                {relay.connected ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => disconnectRelay(relay.url)}
                    title="Disconnect"
                  >
                    <PowerOff className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => connectRelay(relay.url)}
                    title="Connect"
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRelay(relay.url)}
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
