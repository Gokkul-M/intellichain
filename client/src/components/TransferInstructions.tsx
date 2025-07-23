
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Info, ExternalLink } from "lucide-react";

export const TransferInstructions = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          BDAG Token Transfer Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              MetaMask Setup
            </h4>
            <div className="text-sm space-y-1">
              <p>• Install MetaMask in Chrome & Firefox</p>
              <p>• Add BlockDAG Primordial Testnet:</p>
              <div className="ml-4 text-xs bg-gray-100 p-2 rounded">
                <p>Chain ID: 1043</p>
                <p>RPC: https://rpc.primordial.bdagscan.com</p>
                <p>Symbol: BDAG</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              Get Test Tokens
            </h4>
            <div className="text-sm space-y-1">
              <p>• Visit BlockDAG Explorer faucet</p>
              <p>• Mint up to 100 BDAG per day</p>
              <p>• Import BDAG token in MetaMask</p>
              <a 
                href="https://explorer.testnet.blockdag.network" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                Open Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Important Notes:</p>
              <ul className="space-y-1 text-xs">
                <li>• Replace placeholder contract address (0x123...) with actual BDAG token address</li>
                <li>• Ensure both accounts have sufficient BDAG for gas fees</li>
                <li>• Transactions are irreversible on testnet</li>
                <li>• Use testnet tokens only - they have no real value</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
