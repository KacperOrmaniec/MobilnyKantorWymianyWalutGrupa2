import BaseView from "@/components/base-view";
import { WalletWidget } from "@/components/wallet-widget";
import { LatestTransactionWidget } from "@/components/latest-transactions-widget";

export default function HomeScreen() {
  return (
    <BaseView style={{ gap: 18 }}>
      <WalletWidget />
      <LatestTransactionWidget />
    </BaseView>
  );
}
