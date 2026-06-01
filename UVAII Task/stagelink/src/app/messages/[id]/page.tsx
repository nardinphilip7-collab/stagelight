import { redirect } from "next/navigation";

// Legacy deep link: /messages/<userId> → open that thread in the inbox.
export default async function MessageThreadRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/messages?with=${encodeURIComponent(id)}`);
}
