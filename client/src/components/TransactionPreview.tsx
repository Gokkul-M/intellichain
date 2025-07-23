import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Fuel,
  Clock,
  Shield,
  ExternalLink,
  AlertTriangle,
  Code,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartContractViewer } from "./SmartContractViewer";
import { useState, useEffect } from "react";

interface TransactionPreviewProps {
  transaction: {
    type: string;
    from?: string;
    to?: string;
    amount?: string;
    estimatedOutput?: string;
    gasEstimate?: string;
    protocol?: string;
    token?: string;
    apy?: string;
    estimatedRewards?: string;
  };
  onExecute: (tx: any) => Promise<{ hash: string }>;
  disabled?: boolean;
}

export const TransactionPreview = ({
  transaction,
  onExecute,
  disabled,
}: TransactionPreviewProps) => {
  const [isContractViewerOpen, setIsContractViewerOpen] = useState(false);
  const [amount, setAmount] = useState(transaction.amount || "");
  const [gasEstimate, setGasEstimate] = useState(transaction.gasEstimate || "0.001");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (amount) {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        setGasEstimate((parsed * 0.001).toFixed(3));
      }
    }
  }, [amount]);

  const handleExecute = async () => {
    setExecuting(true);
    const txData = { ...transaction, amount, gasEstimate };
    const result = await onExecute(txData);
    if (result?.hash) {
      setTxHash(result.hash);
    }
    setExecuting(false);
  };

  const contractAddress = "0x1234567890123456789012345678901234567890";

  const icons = {
    swap: <ArrowRight className="w-4 h-4" />,
    stake: <Shield className="w-4 h-4" />,
    default: <Clock className="w-4 h-4" />,
  };

  const titles = {
    swap: `Swap ${transaction.from} → ${transaction.to}`,
    stake: `Stake ${transaction.token}`,
    default: "Transaction Preview",
  };

  const riskLevel = transaction.type === "stake" ? "medium" : "low";
  const riskStyles = {
    low: "text-green-700 bg-green-100 border-green-200",
    medium: "text-yellow-700 bg-yellow-100 border-yellow-200",
    high: "text-red-700 bg-red-100 border-red-200",
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md rounded-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            {icons[transaction.type] ?? icons.default}
            {titles[transaction.type] ?? titles.default}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("border", riskStyles[riskLevel])}
          >
            {riskLevel.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3">
          {transaction.type === "swap" && (
            <>
              <TransactionDetail
                label="You Pay"
                value={
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border rounded-md px-2 py-1 w-24 text-right outline-none focus:ring focus:ring-primary/30"
                  />
                }
              />
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <TransactionDetail
                label="You Receive"
                value={`${transaction.estimatedOutput}`}
                highlight
              />
            </>
          )}

          {transaction.type === "stake" && (
            <>
              <TransactionDetail
                label="Stake Amount"
                value={`${amount} ${transaction.token}`}
              />
              <TransactionDetail label="APY" value={transaction.apy} highlight />
              <TransactionDetail
                label="Est. Annual Rewards"
                value={transaction.estimatedRewards}
              />
            </>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          {transaction.protocol && (
            <TransactionDetail
              label="Protocol"
              value={<Badge variant="secondary">{transaction.protocol}</Badge>}
            />
          )}
          {gasEstimate && (
            <TransactionDetail
              icon={<Fuel className="w-3 h-3" />}
              label="Gas Fee"
              value={`${gasEstimate} ETH`}
            />
          )}
        </div>

        <Separator />

        {riskLevel !== "low" && (
          <div className="flex items-start gap-3 p-3 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Review Carefully</p>
              <p className="text-xs">
                This transaction involves staking. Your tokens may be locked.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleExecute}
              disabled={disabled || !!txHash || executing}
              className={cn(
                "flex-1 font-semibold transition-all duration-300",
                txHash
                  ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-default"
                  : ""
              )}
            >
              {txHash ? (
                <span className="flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Transaction Successful
                </span>
              ) : disabled ? (
                "Connect Wallet"
              ) : executing ? (
                "Executing..."
              ) : (
                "Execute Transaction"
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              title="View in Explorer"
              onClick={() =>
                txHash
                  ? window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
                  : undefined
              }
              disabled={!txHash}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsContractViewerOpen(true)}
            className="w-full text-sm"
          >
            <Code className="w-4 h-4 mr-2" />
            View Smart Contract
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1">
          Ensure all details are correct before executing. Network fees apply.
        </p>
      </CardContent>

      <SmartContractViewer
        isOpen={isContractViewerOpen}
        onClose={() => setIsContractViewerOpen(false)}
        contractAddress={contractAddress}
      />
    </Card>
  );
};

const TransactionDetail = ({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span
      className={cn(
        "font-medium",
        highlight ? "text-green-600" : "text-foreground"
      )}
    >
      {value}
    </span>
  </div>
);
