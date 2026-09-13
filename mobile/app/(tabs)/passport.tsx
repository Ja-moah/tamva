import { WalletCards } from "lucide-react-native";

import { CustomerAreaScreen } from "../../components/layout/customer-area-screen";

export default function PassportScreen() {
  return <CustomerAreaScreen title="TAMVA Passport" description="Access portable, permission-controlled financial identity capabilities." icon={WalletCards} />;
}
