import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionCountdownProps {
  endsAt: string;
  compact?: boolean;
  onExpire?: () => void;
}

export function AuctionCountdown({ endsAt, compact = false, onExpire }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endsAt).getTime() - Date.now();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  const isUrgent = timeLeft.total > 0 && timeLeft.total < 60000; // Less than 1 minute
  const isWarning = timeLeft.total > 0 && timeLeft.total < 300000; // Less than 5 minutes

  if (timeLeft.total <= 0) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-muted-foreground",
        compact ? "text-sm" : "text-base"
      )}>
        <Clock className={cn("h-4 w-4", !compact && "h-5 w-5")} />
        <span>Ended</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1 text-sm font-medium",
        isUrgent && "text-destructive animate-pulse",
        isWarning && !isUrgent && "text-warning"
      )}>
        <Clock className="h-4 w-4" />
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-4",
      isUrgent && "text-destructive",
      isWarning && !isUrgent && "text-warning"
    )}>
      <Clock className={cn("h-5 w-5", isUrgent && "animate-pulse")} />
      <div className="flex gap-3">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold">{timeLeft.days}</p>
            <p className="text-xs text-muted-foreground uppercase">Days</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground uppercase">Hours</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground uppercase">Min</p>
        </div>
        <div className="text-center">
          <p className={cn("text-2xl font-bold", isUrgent && "animate-pulse")}>{timeLeft.seconds.toString().padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground uppercase">Sec</p>
        </div>
      </div>
    </div>
  );
}
