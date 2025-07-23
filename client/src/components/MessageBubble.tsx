
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bot, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'success' | 'error';
}

export const MessageBubble = ({ type, content, timestamp, status }: MessageBubbleProps) => {
  const isUser = type === 'user';
  const isSystem = type === 'system';

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;
    
    const variants = {
      success: 'bg-green-500/10 text-green-700 border-green-500/20',
      error: 'bg-red-500/10 text-red-700 border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
    };

    return (
      <Badge variant="outline" className={cn("text-xs", variants[status])}>
        {getStatusIcon()}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  if (isSystem) {
    return (
      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-muted">
        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            System • {format(timestamp, 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary/10" : "bg-muted"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      <div className={cn(
        "flex-1 min-w-0 max-w-[80%]",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-3 text-sm",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {content}
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 mt-2 text-xs text-muted-foreground",
          isUser && "flex-row-reverse"
        )}>
          <span>{format(timestamp, 'HH:mm')}</span>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
};
