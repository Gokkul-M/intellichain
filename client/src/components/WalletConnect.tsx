import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { cn } from "@/lib/utils";

export const WalletConnect = () => {
  const { account, balance, isConnected, connectWallet, disconnect } = useWallet();

  return (
    <Card
      className={cn(
        "w-full max-w-md mx-auto rounded-2xl shadow-xl border-none",
        "bg-white/60 dark:bg-black/40 backdrop-blur-sm transition-all"
      )}
    >
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl p-5 text-white">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <span className="bg-white/20 p-2 rounded-full">
            <Wallet className="w-5 h-5 text-white" />
          </span>
          {isConnected ? "Wallet Connected" : "Connect Wallet"}
        </CardTitle>
        <CardDescription className="text-sm text-white/90 mt-1">
          {isConnected
            ? "Your MetaMask wallet is connected to BlockDAG Testnet"
            : "Connect your MetaMask wallet to interact with BlockDAG smart contracts"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {!isConnected ? (
          <Button
            className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-md hover:scale-[1.02] transition-transform"
            size="lg"
            onClick={connectWallet}
          >
            Connect MetaMask
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-100 via-green-50 to-white dark:from-green-900/40 dark:to-transparent">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                ✅ Connected:{" "}
                <span className="font-mono">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </p>
              {balance && (
                <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                  💰 Balance: {balance} BDAG
                </p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              onClick={disconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
