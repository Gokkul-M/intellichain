import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Pencil, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";


interface SmartContractViewerProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
}

export const SmartContractViewer = ({
  isOpen,
  onClose,
  contractAddress,
}: SmartContractViewerProps) => {
  const [contractCode, setContractCode] = useState<string>("");
  const [editedCode, setEditedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const mockContractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IntelliChainToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18;
    uint256 public totalMinted;
    
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor(string memory name, string memory symbol, address initialOwner)
        ERC20(name, symbol) Ownable(initialOwner) {
        _mint(initialOwner, 100000000 * 10**18);
        totalMinted = 100000000 * 10**18;
    }

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        totalMinted += amount;
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        require(to != address(0), "Transfer to zero address");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount)
        public override returns (bool) {
        require(to != address(0), "Transfer to zero address");
        return super.transferFrom(from, to, amount);
    }
}`;

  useEffect(() => {
    if (isOpen && contractAddress) {
      setIsLoading(true);
      setTimeout(() => {
        setContractCode(mockContractCode);
        setEditedCode(mockContractCode);
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, contractAddress]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractCode);
    toast({
      title: "Copied to clipboard",
      description: "Smart contract code copied successfully.",
    });
  };

  const openInExplorer = () => {
    window.open(`https://explorer.blockdag.network/address/${contractAddress}`, "_blank");
  };

  const saveChanges = () => {
    setContractCode(editedCode);
    toast({
      title: "Code Updated",
      description: "Contract code has been updated in the viewer.",
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-4 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 sticky top-0 bg-background z-10 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">Smart Contract Source Code</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={isLoading}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={openInExplorer}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Explorer
              </Button>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={saveChanges}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            Contract: <span className="font-mono break-all">{contractAddress}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 rounded-md bg-muted/30 p-3 border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading contract source code...
              </div>
            </div>
          ) : isEditing ? (
            <Textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="h-full resize-none text-sm font-mono"
              autoFocus
            />
          ) : (
            <SyntaxHighlighter
              language="solidity"
              style={vscDarkPlus}
              customStyle={{
                padding: "1em",
                borderRadius: "0.5em",
                fontSize: "0.85rem",
                backgroundColor: "transparent"
              }}
            >
              {contractCode}
            </SyntaxHighlighter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
