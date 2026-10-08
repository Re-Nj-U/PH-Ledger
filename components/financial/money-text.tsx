import { formatMoney, type CurrencyFormat } from "@/lib/money";
import { demoBusiness } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function MoneyText({
  amount,
  className,
  config = demoBusiness,
}: {
  amount: string;
  className?: string;
  config?: CurrencyFormat;
}) {
  return (
    <span className={cn("money", className)}>
      {formatMoney(amount, config)}
    </span>
  );
}
