import { CircleEllipsis } from "lucide-react-native";

import { CustomerAreaScreen } from "../../components/layout/customer-area-screen";

export default function MoreScreen() {
  return <CustomerAreaScreen title="Profile, consent, and settings" description="Manage customer preferences and future consent, connection, profile, and notification workflows." icon={CircleEllipsis} />;
}
