import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelayDebugger } from '@/components/debug/RelayDebugger';
import { RequestBuilder } from '@/components/debug/RequestBuilder';
import { StreamViewer } from '@/components/debug/StreamViewer';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface RelayConnection {
  url: string;
  connected: boolean;
  ws: WebSocket | null;
}

interface StreamMessage {
  id: string;
  timestamp: number;
  relay: string;
  type: 'sent' | 'received';
  data: unknown;
}

export function Debug() {
  const [relays, setRelays] = useState<RelayConnection[]>([]);
  const [messages, setMessages] = useState<StreamMessage[]>([]);

  const addMessage = (relay: string, type: 'sent' | 'received', data: unknown) => {
    const message: StreamMessage = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      relay,
      type,
      data,
    };
    setMessages((prev) => [message, ...prev]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Nostr Debug Console
        </h1>
        <p className="text-muted-foreground">
          Configure relays, craft requests, and monitor the raw Nostr protocol stream
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relay Configuration</CardTitle>
              <CardDescription>
                Manage WebSocket connections to Nostr relays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RelayDebugger 
                relays={relays} 
                setRelays={setRelays}
                onMessage={addMessage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Builder</CardTitle>
              <CardDescription>
                Craft and send REQ, EVENT, or CLOSE messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestBuilder 
                relays={relays}
                onSend={addMessage}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Protocol Stream</CardTitle>
                  <CardDescription>
                    Real-time view of all messages sent and received
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  title="Clear messages"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StreamViewer messages={messages} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>NIP-01 Protocol Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="req">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="req">REQ</TabsTrigger>
              <TabsTrigger value="event">EVENT</TabsTrigger>
              <TabsTrigger value="close">CLOSE</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            <TabsContent value="req" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">REQ Message</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Request events and subscribe to new updates
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`["REQ", <subscription_id>, <filters1>, <filters2>, ...]

Example:
["REQ", "sub1", {"kinds": [1], "limit": 10}]`}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="event" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">EVENT Message</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Publish events to relays
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`["EVENT", <event JSON>]

Event structure:
{
  "id": "<32-byte hex event id>",
  "pubkey": "<32-byte hex pubkey>",
  "created_at": <unix timestamp>,
  "kind": <integer>,
  "tags": [["tag", "value"], ...],
  "content": "<string>",
  "sig": "<64-byte hex signature>"
}`}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="close" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">CLOSE Message</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Stop previous subscriptions
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`["CLOSE", <subscription_id>]

Example:
["CLOSE", "sub1"]`}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="filters" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Filter Object</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Specify which events to retrieve
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "ids": ["<event id>", ...],
  "authors": ["<pubkey>", ...],
  "kinds": [<kind number>, ...],
  "#e": ["<event id>", ...],
  "#p": ["<pubkey>", ...],
  "since": <unix timestamp>,
  "until": <unix timestamp>,
  "limit": <number>
}

Example:
{
  "kinds": [1],
  "authors": ["abc123..."],
  "limit": 20,
  "since": 1234567890
}`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
