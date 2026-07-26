import { permanentRedirect } from "next/navigation";

export default function LegacyTrainingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  permanentRedirect(`/training/${params.id}`);
}
