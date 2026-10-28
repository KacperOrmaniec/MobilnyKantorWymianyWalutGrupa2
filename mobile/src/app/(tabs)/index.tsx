import BaseView from "@/components/base-view";
import { WalletWidget } from "@/components/wallet-widget";
import { LatestTransactionWidget } from "@/components/latest-transaction-widget";

export default function HomeScreen() {
  return (
    <BaseView>
      <WalletWidget />
      <LatestTransactionWidget />
    </BaseView>
  );
}
