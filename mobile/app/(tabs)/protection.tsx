import { ShieldCheck } from "lucide-react-native";

import { CustomerAreaScreen } from "../../components/layout/customer-area-screen";

export default function ProtectionScreen() {
  return <CustomerAreaScreen title="Protection" description="Review protection status and backend-generated security guidance." icon={ShieldCheck} />;
}
