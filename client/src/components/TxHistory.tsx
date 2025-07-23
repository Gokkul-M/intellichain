import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, Fuel } from "lucide-react";

interface Transaction {
  id: string;
  hash: string;
  type: string;
  status: "success" | "pending" | "failed";
  timestamp: Date;
  value?: string;
  gasUsed?: string;
}

interface TxHistoryProps {
  transactions: Transaction[];
  maxItems?: number;
}

export const TxHistory = ({ transactions, maxItems = 10 }: TxHistoryProps) => {
  const displayTransactions = transactions.slice(0, maxItems);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "outline";
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Your transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayTransactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{tx.type}</p>
                <Badge variant="outline" className={getStatusVariant(tx.status)}>
                  {tx.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}</span>
                <span>{tx.timestamp.toLocaleDateString()}</span>
                {tx.value && <span>{tx.value}</span>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {transactions.length > maxItems && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              View All ({transactions.length} total)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};