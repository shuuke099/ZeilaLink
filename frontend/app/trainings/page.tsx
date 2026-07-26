import { permanentRedirect } from "next/navigation";

export default function LegacyTrainingsPage() {
  permanentRedirect("/training");
}
