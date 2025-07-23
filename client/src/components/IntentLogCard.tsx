import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, CheckCircle, AlertCircle, Loader, Copy } from "lucide-react";
import { toast } from "sonner";

interface IntentLogProps {
  id: string;
  prompt: string;
  functionName: string;
  txHash?: string;
  status: "pending" | "success" | "failed";
  timestamp: Date;
  gasUsed?: string;
}

export const IntentLogCard = ({
  id,
  prompt,
  functionName,
  txHash,
  status,
  timestamp,
  gasUsed
}: IntentLogProps) => {

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      success: "bg-green-100 text-green-700 border-green-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200"
    };

    return (
      <Badge variant="outline" className={`px-2 py-1 flex items-center gap-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {getStatusIcon()}
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const handleCopyHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast.success("Transaction hash copied to clipboard");
    }
  };

  return (
    <Card className="hover:shadow-md transition-all border rounded-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">User Prompt</label>
          <div className="bg-muted/50 p-3 rounded-md text-sm">{prompt}</div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Executed Function</label>
          <div className="bg-muted/50 p-3 rounded-md font-mono text-sm">{functionName}</div>
        </div>

        {txHash && (
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Transaction Hash</label>
            <div className="flex items-center gap-2">
              <div className="bg-muted/50 px-3 py-2 rounded-md font-mono text-sm truncate flex-1">
                {txHash.slice(0, 8)}...{txHash.slice(-8)}
              </div>
              <Button size="icon" variant="ghost" className="hover:bg-muted" onClick={handleCopyHash}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-muted">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {gasUsed && status === "success" && (
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Gas Used</label>
            <div className="bg-muted/50 p-3 rounded-md text-sm">{gasUsed}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
