import { ScrollText } from "lucide-react-native";

import { CustomerAreaScreen } from "../../components/layout/customer-area-screen";

export default function ActivityScreen() {
  return <CustomerAreaScreen title="Financial activity" description="Review normalized activity delivered by the backend ledger API." icon={ScrollText} />;
}
